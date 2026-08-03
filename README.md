# Visora

API-first micro-SaaS that turns HTML/Tailwind templates into pixel-perfect
OG images, product banners, and certificates — rendered by real headless
Chromium instead of an AI model guessing at pixels.

## Status

- ✅ **Phase 1** — Cinematic hero landing UI (`src/components/VisoraHero.jsx`)
- ✅ **Phase 2** — Supabase schema + render engine (`supabase/`, `worker/`)
- ⬜ Phase 3 — Dashboard & billing integration
- ⬜ Phase 4 — CI/CD & production deployment

## Architecture (all on Cloudflare)

- **Frontend** — Cloudflare **Pages** (`src/`)
- **Render API** — Cloudflare **Worker** (`worker/`), using the
  [Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
  binding to drive real headless Chromium and **R2** to store output images
- **Database / Auth** — Supabase (Postgres + Row Level Security)

## Structure

```
index.html                      Vite entry point
src/main.jsx                    Mounts the hero page
src/components/VisoraHero.jsx   Landing page hero component
supabase/migrations/            Postgres schema + RLS policies
worker/                         Cloudflare Worker render engine
worker/wrangler.toml            Worker config: Browser Rendering + R2 bindings
```

## Frontend (Cloudflare Pages) setup

In the Pages project's **Settings → Build**, set:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (repo root)

Local dev:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Render worker setup

Requires the **Workers Paid plan** ($5/mo base) — Browser Rendering bills
per browser-minute on top of that. Enable it in the Cloudflare dashboard
under Workers & Pages → Browser Rendering before deploying.

```bash
cd worker
npm install

# One-time setup
npx wrangler r2 bucket create visora-renders
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

npm run dev      # local dev
npm run deploy   # deploy to Cloudflare
```

Then:

```bash
curl -X POST https://<your-worker>.workers.dev/api/v1/render \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"template_id": "tpl_ecom_v1", "format": "png", "data": {"title": "Nike Air Max 270"}}'
```

See the full API spec, DB schema, and roadmap in the project spec document.
