# Visora

API-first micro-SaaS that turns HTML/Tailwind templates into pixel-perfect
OG images, product banners, and certificates — rendered by real headless
Chromium instead of an AI model guessing at pixels.

## Status

- ✅ **Phase 1** — Cinematic hero landing UI (`src/components/VisoraHero.jsx`)
- ✅ **Phase 2** — Supabase schema + Node.js render engine (`supabase/`, `worker/`)
- ⬜ Phase 3 — Dashboard & billing integration
- ⬜ Phase 4 — CI/CD & production deployment

## Structure

```
src/components/VisoraHero.jsx   Landing page hero component (Next.js/React)
supabase/migrations/            Postgres schema + RLS policies
worker/                         Fastify + puppeteer-core render engine
worker/Dockerfile               Container image for the render worker
```

## Render engine quickstart

```bash
cd worker
cp .env.example .env   # fill in your Supabase project URL + service role key
npm install
npm run dev
```

Then:

```bash
curl -X POST http://localhost:8787/api/v1/render \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"template_id": "tpl_ecom_v1", "format": "png", "data": {"title": "Nike Air Max 270"}}'
```

See the full API spec, DB schema, and roadmap in the project spec document.
