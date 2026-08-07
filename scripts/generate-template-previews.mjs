#!/usr/bin/env node
// Generates preview thumbnails for the template gallery by actually
// rendering each preset with its own default_variables through
// Visora's render API — the same API customers call. Dogfooding: the
// "here's what this template looks like" images ARE renders.
//
// Usage:
//   SUPABASE_URL=... \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   VISORA_API_URL=https://visora-render-worker.mrcru96.workers.dev \
//   VISORA_API_KEY=VISORA_LIVE_... \
//     node scripts/generate-template-previews.mjs
//
// VISORA_API_KEY should be a real key with enough quota for ~30 renders
// (your own account's key is fine — these count as normal renders).
// Re-running is safe/idempotent: it just re-renders and overwrites
// preview_image_url for every preset each time.

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VISORA_API_URL, VISORA_API_KEY } = process.env;

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VISORA_API_URL,
  VISORA_API_KEY,
})) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: presets, error } = await supabase
    .from('templates')
    .select('id, title, default_variables')
    .eq('is_preset', true)
    .order('title', { ascending: true });

  if (error) {
    console.error('Failed to list presets:', error.message);
    process.exit(1);
  }

  console.log(`Found ${presets.length} presets. Rendering...\n`);

  let ok = 0;
  let failed = 0;

  for (const tpl of presets) {
    process.stdout.write(`  ${tpl.title} (${tpl.id})... `);

    try {
      const res = await fetch(`${VISORA_API_URL.replace(/\/$/, '')}/api/v1/render`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VISORA_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          template_id: tpl.id,
          format: 'png',
          cache: false, // force a fresh render even if one was cached before
          data: tpl.default_variables ?? {},
        }),
      });

      const body = await res.json();

      if (!res.ok || !body?.success || !body.data?.url) {
        console.log(`FAILED (${body?.error || res.status})`);
        failed++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('templates')
        .update({ preview_image_url: body.data.url })
        .eq('id', tpl.id);

      if (updateError) {
        console.log(`rendered but DB update failed: ${updateError.message}`);
        failed++;
        continue;
      }

      console.log('OK');
      ok++;
    } catch (err) {
      console.log(`FAILED (${err instanceof Error ? err.message : String(err)})`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} succeeded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
