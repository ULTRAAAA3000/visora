import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

import { authenticate, json } from './lib/auth';
import { fillTemplate, renderHtmlToImage, type TemplateVariables } from './lib/render';
import type { Env } from './env';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

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

  const renderTimeMs = Date.now() - startedAt;
  const key = `${new Date().toISOString().slice(0, 7)}/render_${nanoid(10)}.${format}`;

  await env.RENDERS.put(key, imageBuffer, {
    httpMetadata: { contentType: format === 'jpeg' ? 'image/jpeg' : 'image/png' },
  });

  const imageUrl = `${url.origin}/renders/${key}`;

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
    ]).catch((err) => console.error('Post-render bookkeeping failed', err))
  );

  return json({
    success: true,
    render_time: `${renderTimeMs}ms`,
    cached: false,
    data: {
      url: imageUrl,
      width: template.width ?? 1200,
      height: template.height ?? 630,
      format,
    },
  });
}
