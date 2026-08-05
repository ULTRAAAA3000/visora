# Visora

API-first micro-SaaS that turns HTML/Tailwind templates into pixel-perfect
OG images, product banners, and certificates — rendered by real headless
Chromium instead of an AI model guessing at pixels.

## Status

- ✅ **Phase 1** — Cinematic hero landing UI (`src/components/VisoraHero.tsx`)
- ✅ **Phase 2** — Supabase schema + render engine (`supabase/`, `worker/`)
- ✅ **Phase 3** — Dashboard: auth, API key, template editor with live preview
- ✅ Fully TypeScript (frontend + Worker) — see "Type safety" below
- ⬜ Phase 4 — CI/CD & production deployment polish, billing (LemonSqueezy)

## Architecture (all on Cloudflare)

- **Frontend** — Cloudflare **Pages** (`src/`), Vite + React + TypeScript
- **Render API** — Cloudflare **Worker** (`worker/`), TypeScript, using the
  [Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
  binding to drive real headless Chromium and **R2** to store output images
- **Database / Auth** — Supabase (Postgres + Row Level Security)

## Structure

```
index.html                        Vite entry point
src/main.tsx                      Router: landing, auth, dashboard
src/components/VisoraHero.tsx     Landing page hero component
src/lib/supabase.ts               Supabase client (browser, anon key), typed via database.types.ts
src/lib/database.types.ts         Hand-written types mirroring supabase/migrations/*.sql
src/lib/AuthContext.tsx           Auth session + profile (auto-creates on first login)
src/pages/Login.tsx, Signup.tsx   Auth pages
src/pages/dashboard/              Overview (API key/quota), Templates, TemplateEditor
supabase/migrations/              Postgres schema + RLS policies
worker/                           Cloudflare Worker render engine (TypeScript)
worker/src/env.ts                 Env interface for Worker bindings
worker/wrangler.toml              Worker config: Browser Rendering + R2 bindings
```

## Type safety

Both the frontend and the Worker are TypeScript. Two non-obvious things
worth knowing if you touch `src/lib/database.types.ts`:

1. **Insert/Update types are explicit object literals**, not derived via
   `Partial<Row> & Pick<...>`. supabase-js's generic constraint resolution
   doesn't reliably simplify intersection types through its internal
   conditional-type chain — using one silently collapses every
   `.insert()`/`.update()` call's argument type to `never` instead of
   erroring, which is easy to miss.
2. **Row/Insert/Update are `type` aliases, not `interface`.** Interfaces
   break the same constraint resolution for reasons that don't reduce to
   a one-line explanation (declaration-merging semantics colliding with
   supabase-js's deeply nested conditional `Schema` type), even though
   they're structurally identical to the equivalent `type`. This is the
   same shape `supabase gen types typescript` generates, for the same
   reason — so if the schema changes enough that hand-maintaining this
   gets tedious, generating instead of hand-writing is the way out.

`npm run typecheck` (frontend) and `cd worker && npm run typecheck`
(Worker) run `tsc --noEmit` on their own.

## Frontend (Cloudflare Pages) setup

In the Pages project's **Settings → Build**, set:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (repo root)

In **Settings → Variables and secrets**, add (Production + Preview):

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key (safe client-side; RLS is on)

Local dev:

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
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
