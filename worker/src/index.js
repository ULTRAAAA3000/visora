import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

import { createAuthMiddleware } from './middleware/auth.js';
import { fillTemplate, renderHtmlToImage } from './lib/render.js';
import { closeBrowser } from './lib/browser.js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  STORAGE_BUCKET = 'renders',
  PORT = 8787,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const authenticate = createAuthMiddleware(supabase);

const app = Fastify({ logger: true });

await app.register(rateLimit, {
  max: 60, // per-IP ceiling; per-key quota is enforced separately via Supabase
  timeWindow: '1 minute',
});

app.get('/health', async () => ({ status: 'ok' }));

app.post('/api/v1/render', { preHandler: authenticate }, async (request, reply) => {
  const startedAt = Date.now();
  const { template_id, format = 'png', cache = true, data = {} } = request.body ?? {};

  if (!template_id) {
    return reply.code(400).send({ success: false, error: '`template_id` is required.' });
  }

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', template_id)
    .single();

  if (templateError || !template) {
    return reply.code(404).send({ success: false, error: 'Template not found.' });
  }

  const html = fillTemplate(template.html_body, data, template.default_variables ?? {});

  let imageBuffer;
  try {
    imageBuffer = await renderHtmlToImage({
      html,
      width: template.width ?? 1200,
      height: template.height ?? 630,
      format,
    });
  } catch (err) {
    request.log.error(err, 'Render failed');
    return reply.code(500).send({ success: false, error: 'Render failed.' });
  }

  const renderTimeMs = Date.now() - startedAt;
  const fileName = `${new Date().toISOString().slice(0, 7)}/render_${nanoid(10)}.${format}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, imageBuffer, {
      contentType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
      cacheControl: cache ? '31536000' : '0',
      upsert: false,
    });

  if (uploadError) {
    request.log.error(uploadError, 'Upload to storage failed');
    return reply.code(500).send({ success: false, error: 'Storage upload failed.' });
  }

  const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

  // Fire-and-forget usage + log bookkeeping — doesn't block the response.
  Promise.all([
    supabase
      .from('profiles')
      .update({ usage_this_month: request.profile.usage_this_month + 1 })
      .eq('id', request.profile.id),
    supabase.from('render_logs').insert({
      user_id: request.profile.id,
      template_id,
      render_time_ms: renderTimeMs,
      status_code: 200,
      image_url: publicUrlData.publicUrl,
    }),
  ]).catch((err) => request.log.error(err, 'Post-render bookkeeping failed'));

  return reply.send({
    success: true,
    render_time: `${renderTimeMs}ms`,
    cached: false,
    data: {
      url: publicUrlData.publicUrl,
      width: template.width ?? 1200,
      height: template.height ?? 630,
      format,
    },
  });
});

const shutdown = async () => {
  await closeBrowser();
  await app.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app
  .listen({ port: Number(PORT), host: '0.0.0.0' })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
