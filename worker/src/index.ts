import { createClient } from '@supabase/supabase-js';

import { authenticate, json } from './lib/auth';
import { handleCreateBankInvoice, runMonobankReconciliation } from './lib/bank-payments';
import { handlePaddleWebhook } from './lib/billing';
import { computeCacheKey } from './lib/cache';
import { handleContact } from './lib/contact';
import { handleListCreditPackages, handleVerifyCryptoPayment } from './lib/crypto-payments';
import { fillTemplate, renderHtmlToImage, type TemplateVariables } from './lib/render';
import { handleTrack } from './lib/track';
import { deliverRenderWebhook } from './lib/webhook';
import type { Env } from './env';

// A handful of endpoints (contact form, self-hosted pageview tracking,
// the dashboard's "send test webhook" button) are called directly from
// the browser, and the Pages frontend + this Worker live on different
// origins — so they need CORS. Permissive (`*`) is fine here: render/
// whoami/templates/webhook-test still require a valid API key, and
// contact/track are meant to be publicly reachable anyway.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const response = await route(request, env, ctx);
    return withCors(response);
  },

  // Monobank reconciliation cron — see wrangler.toml's [triggers] and
  // bank-payments.ts for the actual polling/matching logic. Wrapped in
  // waitUntil so the invocation isn't torn down mid-flight.
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    ctx.waitUntil(runMonobankReconciliation(env, supabase));
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ status: 'ok' });
    }

    // Serve previously rendered images straight out of R2, so the API
    // response's image_url can point at this same Worker's domain
    // without needing R2's bucket-level public access enabled.
    if (request.method === 'GET' && url.pathname.startsWith('/renders/')) {
      const key = url.pathname.replace('/renders/', '');
      const object = await env.RENDERS.get(key);
      if (!object) return new Response('Not found', { status: 404 });

      return new Response(object.body, {
        headers: {
          'content-type': object.httpMetadata?.contentType || 'image/png',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/render') {
      return handleRender(request, env, ctx, url);
    }

    // Stable, self-healing thumbnail URL for preset templates — used by
    // the dashboard and public template galleries. Unlike storing a
    // one-off rendered image URL in `templates.preview_image_url` (which
    // goes stale whenever the API domain changes or a preset's
    // html_body is edited), this path recomputes the cache key from the
    // template's *current* state on every request. A fresh preset is
    // rendered once, then served from R2 on every subsequent hit.
    if (request.method === 'GET' && /^\/preview\/[^/]+\.png$/.test(url.pathname)) {
      const templateId = url.pathname.slice('/preview/'.length, -'.png'.length);
      return handlePreview(templateId, env);
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/whoami') {
      return handleWhoami(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/templates') {
      return handleListTemplates(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/webhooks/test') {
      return handleTestWebhook(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/contact') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      return handleContact(request, env, supabase);
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/track') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      return handleTrack(request, supabase);
    }

    if (request.method === 'POST' && url.pathname === '/webhooks/paddle') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      return handlePaddleWebhook(request, env.PADDLE_WEBHOOK_SECRET, supabase);
    }

    // Hybrid payment infrastructure (credits, alongside Paddle
    // subscriptions) — see lib/crypto-payments.ts and lib/bank-payments.ts.
    if (request.method === 'GET' && url.pathname === '/api/v1/payments/packages') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      return handleListCreditPackages(supabase);
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/payments/crypto/verify') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      return handleVerifyCryptoPayment(request, env, supabase);
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/payments/bank/request') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      return handleCreateBankInvoice(request, env, supabase);
    }

    return new Response('Not found', { status: 404 });
}

/**
 * Lists templates the caller can render: presets, plus their own custom
 * templates. Exists mainly so integrations (Make.com's template picker,
 * eventually a browser extension) don't have to hardcode or ask users
 * to memorize template_id strings.
 */
async function handleListTemplates(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const auth = await authenticate(request, supabase);
  if (auth.error) return auth.error;

  const { data: templates, error } = await supabase
    .from('templates')
    .select('id, title, category, width, height, is_preset, default_variables')
    .or(`is_preset.eq.true,user_id.eq.${auth.profile.id}`)
    .order('is_preset', { ascending: false })
    .order('title', { ascending: true });

  if (error) {
    return json({ success: false, error: 'Could not list templates.' }, 500);
  }

  return json({ success: true, data: templates ?? [] });
}

/**
 * Lightweight "is this API key valid" check — no render, no quota
 * consumption. Used by the Make.com connection test (Make's best
 * practice: every connection should validate against a cheap endpoint
 * that only needs the API key) and useful generally for anyone
 * building an integration who wants to sanity-check a key first.
 */
async function handleWhoami(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const authHeader = request.headers.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return json({ success: false, error: 'Missing or malformed Authorization header. Expected: Bearer <api_key>' }, 401);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, plan_tier, monthly_quota, usage_this_month')
    .eq('api_key', token)
    .single();

  if (error || !profile) {
    return json({ success: false, error: 'Invalid API key.' }, 401);
  }

  return json({
    success: true,
    data: {
      email: profile.email,
      plan_tier: profile.plan_tier,
      monthly_quota: profile.monthly_quota,
      usage_this_month: profile.usage_this_month,
    },
  });
}

interface RenderRequestBody {
  template_id?: string;
  format?: 'png' | 'jpeg';
  data?: TemplateVariables;
}

async function handleRender(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  const startedAt = Date.now();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const auth = await authenticate(request, supabase);
  if (auth.error) return auth.error;
  const { profile } = auth;

  let body: RenderRequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const { template_id, format = 'png', data = {} } = body ?? {};
  if (!template_id) {
    return json({ success: false, error: '`template_id` is required.' }, 400);
  }

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', template_id)
    .single();

  if (templateError || !template) {
    return json({ success: false, error: 'Template not found.' }, 404);
  }

  // Fully determined by (template content, format, input data), so the
  // storage key doubles as the cache key — no separate random filename
  // needed. `template.updated_at` folds in template edits automatically
  // invalidating stale cache entries (see 0018's trigger).
  const cacheKey = await computeCacheKey(template_id, template.updated_at, format, data);
  const cached = await env.RENDERS.head(cacheKey);
  const imageUrl = `${url.origin}/renders/${cacheKey}`;

  let renderTimeMs: number;

  if (cached) {
    renderTimeMs = Date.now() - startedAt;
  } else {
    const html = fillTemplate(template.html_body, data, template.default_variables ?? {});

    let imageBuffer: Uint8Array;
    try {
      imageBuffer = await renderHtmlToImage(env.MYBROWSER, {
        html,
        width: template.width ?? 1200,
        height: template.height ?? 630,
        format,
      });
    } catch (err) {
      console.error('Render failed', err);
      return json({ success: false, error: 'Render failed.' }, 500);
    }

    renderTimeMs = Date.now() - startedAt;

    await env.RENDERS.put(cacheKey, imageBuffer, {
      httpMetadata: { contentType: format === 'jpeg' ? 'image/jpeg' : 'image/png' },
    });
  }

  // Bookkeeping shouldn't block the response, but Workers terminate the
  // isolate once the response is returned unless kept alive explicitly.
  ctx.waitUntil(
    Promise.all([
      supabase
        .from('profiles')
        .update({ usage_this_month: profile.usage_this_month + 1 })
        .eq('id', profile.id),
      supabase.from('render_logs').insert({
        user_id: profile.id,
        template_id,
        render_time_ms: renderTimeMs,
        status_code: 200,
        image_url: imageUrl,
      }),
      deliverRenderWebhook(profile, 'render.completed', {
        template_id,
        image_url: imageUrl,
        width: template.width ?? 1200,
        height: template.height ?? 630,
        format,
        render_time_ms: renderTimeMs,
      }),
    ]).catch((err) => console.error('Post-render bookkeeping failed', err))
  );

  return json({
    success: true,
    render_time: `${renderTimeMs}ms`,
    cached: Boolean(cached),
    data: {
      url: imageUrl,
      width: template.width ?? 1200,
      height: template.height ?? 630,
      format,
    },
  });
}

/**
 * Public, unauthenticated thumbnail for a preset template — renders
 * with the preset's own default_variables (there's no per-request data
 * to render private content with, and only presets are eligible, so
 * this can't be used to peek at another user's custom template).
 * Cache-key based on the same (template_id, updated_at, format, data)
 * scheme as the real render endpoint, so editing a preset's html_body
 * automatically invalidates its stale thumbnail on the next view.
 */
async function handlePreview(templateId: string, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_preset', true)
    .single();

  if (error || !template) {
    return new Response('Not found', { status: 404 });
  }

  const cacheKey = await computeCacheKey(
    templateId,
    template.updated_at,
    'png',
    template.default_variables ?? {}
  );

  let object = await env.RENDERS.get(cacheKey);

  if (!object) {
    const html = fillTemplate(template.html_body, template.default_variables ?? {}, template.default_variables ?? {});

    let imageBuffer: Uint8Array;
    try {
      imageBuffer = await renderHtmlToImage(env.MYBROWSER, {
        html,
        width: template.width ?? 1200,
        height: template.height ?? 630,
        format: 'png',
      });
    } catch (err) {
      console.error('Preview render failed', err);
      return new Response('Render failed', { status: 500 });
    }

    await env.RENDERS.put(cacheKey, imageBuffer, {
      httpMetadata: { contentType: 'image/png' },
    });
    object = await env.RENDERS.get(cacheKey);
    if (!object) return new Response('Render failed', { status: 500 });
  }

  return new Response(object.body, {
    headers: {
      'content-type': 'image/png',
      // Short-ish cache: long enough to avoid re-rendering on every
      // gallery view, short enough that an edited preset's new
      // thumbnail shows up without needing a manual cache-bust.
      'cache-control': 'public, max-age=3600',
    },
  });
}

/**
 * Lets a Pro/Agency user fire a fake `webhook.test` event at their own
 * configured endpoint from the dashboard, so they can verify signature
 * verification and their handler's plumbing without needing to spend a
 * real render on it. Doesn't touch monthly_quota — this isn't a render.
 */
async function handleTestWebhook(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const authHeader = request.headers.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return json({ success: false, error: 'Missing or malformed Authorization header. Expected: Bearer <api_key>' }, 401);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan_tier, webhook_url, webhook_secret')
    .eq('api_key', token)
    .single();

  if (error || !profile) {
    return json({ success: false, error: 'Invalid API key.' }, 401);
  }

  if (profile.plan_tier !== 'pro' && profile.plan_tier !== 'agency') {
    return json({ success: false, error: 'Webhooks are a Pro/Agency feature.' }, 403);
  }

  if (!profile.webhook_url) {
    return json({ success: false, error: 'No webhook_url is set on your account yet.' }, 400);
  }

  await deliverRenderWebhook(profile, 'webhook.test', {
    message: "This is a test event from Visora's dashboard.",
  });

  return json({ success: true });
}
