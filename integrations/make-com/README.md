# Visora — Make.com custom app

A private custom app for [Make](https://make.com) so Visora renders can
drop into any Make scenario: `Render Image` takes a template + key/value
data and returns the resulting image URL, ready to pass to whatever's
next (post to Slack, attach to an email, upload to a CMS, etc.).

Unlike the WordPress plugin and Telegram bot, this isn't a one-click
"Connect to Visora" handshake — Make's API-key connections just ask the
user to paste in a key they already have (from the dashboard, the
Telegram bot's `/mykey`, or the WP plugin's Settings page). Simpler,
and it's the standard pattern for Make custom apps.

## What's in this folder

Make's Custom Apps editor (Developer Portal) is JSON-based but edited
per-component through their web UI or VS Code extension — there's no
single-file app bundle to deploy via CLI the way the Cloudflare Workers
here are. These files are the source of truth for each component; copy
them into the corresponding tab when building the app.

| File | Goes into |
|---|---|
| `base.json` | App → **Base** |
| `connection.json` | Connections → new connection → **Settings** (parameters) |
| `connection.communication.json` | Connections → your connection → **Communication** |
| `rpcs/list-templates.json` | RPCs → new RPC → **Settings** |
| `rpcs/list-templates.communication.json` | RPCs → your RPC → **Communication** |
| `modules/render-image.json` | Modules → new module (type: Action) → **Settings** (parameters) |
| `modules/render-image.communication.json` | Modules → your module → **Communication** |
| `modules/render-image.interface.json` | Modules → your module → **Interface** |

## Build it

1. **Create the app.** [Make Developer Portal](https://www.make.com/en/developer-hub) → Apps → Create a new app → name it `Visora`.
2. **Base.** Paste `base.json`'s `baseUrl` value (or the file's contents, depending on the editor version) into the app's Base tab. This is the current Cloudflare Worker URL — update it once the custom domain migration lands (main roadmap item 8).
3. **Connection.**
   - New connection, type **API Key** (`basic`).
   - Settings tab: paste `connection.json`.
   - Communication tab: paste `connection.communication.json`. This validates the key against `GET /api/v1/whoami` (added to the render worker specifically for this) — no render, no quota used, just confirms the key works.
4. **RPC (template picker).**
   - New RPC named `listTemplates`.
   - Settings: paste `rpcs/list-templates.json`.
   - Communication: paste `rpcs/list-templates.communication.json`. Calls `GET /api/v1/templates` and turns the result into `{value, label}` pairs.
5. **Module: Render Image.**
   - New module, type **Action**, connection `visora`.
   - Settings/Parameters: paste `modules/render-image.json`.
   - Communication: paste `modules/render-image.communication.json`.
   - Interface: paste `modules/render-image.interface.json`.
6. **Publish** as a private app (no need to submit to Make's public directory for this to work in your own scenarios — same idea as sideloading the WordPress plugin zip before it clears review).

## How "Template Data" works

The module exposes a repeatable **key / value** row list instead of a
raw JSON field, since most Make users would rather map fields visually
than hand-write JSON. The communication step folds that array back into
an object with Make's built-in `toCollection()` IML function before
sending it as the API's `data` field — so a template using `{{title}}`
and `{{price}}` just needs two rows: `title` / `Nike Air Max 270` and
`price` / `3,499 UAH`.

## Known limitation

`GET /api/v1/whoami` and `GET /api/v1/templates` count against the
account's API key like any other authenticated call, but they don't
increment `usage_this_month` (only an actual render does) — checking
the render worker's `handleWhoami`/`handleListTemplates` if that
behavior ever needs to change.
