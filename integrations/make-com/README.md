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

## Where to build it

Inside your own Make account (`eu1.make.com` or `us1.make.com`, not a
separate developer site) — left sidebar → **More** → **Custom apps**
(it's tucked under "More" if not shown directly) → create a new app
named `Visora`.

## Important: name/label/type go in the creation dialog, not the JSON

When you click "Add" for a connection, module, or RPC, Make's own
dialog asks for **Name**, **Label**, **Type**, and (for modules) which
**Connection** to attach. Those aren't pasted as JSON — you type them
directly in that dialog. The JSON files here are for the tabs that
open *after* that (Communication, Parameters, Interface).

Use these names/labels when the dialog asks:

| Component | Name | Label | Type |
|---|---|---|---|
| Connection | `visora` | Visora | API Key (basic) |
| RPC | `listTemplates` | List Templates | — |
| Module | `renderImage` | Render Image | Action, connection: `visora` |

## What's in this folder

| File | Goes into |
|---|---|
| `base.json` | App → **Base** tab |
| `connection.json` | Connection → **Parameters** tab (just the array — Name/Label/Type were set in the creation dialog) |
| `connection.communication.json` | Connection → **Communication** tab |
| `rpcs/list-templates.json` | RPC → **Parameters** tab — this one takes no input, leave it `[]` |
| `rpcs/list-templates.communication.json` | RPC → **Communication** tab |
| `modules/render-image.json` | Module → **Mappable Parameters** tab (just the array — leave Static Parameters as `[]`) |
| `modules/render-image.communication.json` | Module → **Communication** tab |
| `modules/render-image.interface.json` | Module → **Interface** tab |

## Build it, step by step

1. **Create the app.** Custom apps dashboard → create app → name `Visora`.
2. **Base.** Open the Base tab, paste `base.json`. This is the current Cloudflare Worker URL — update it once the custom domain migration lands (main roadmap item 8).
3. **Connection.**
   - Add a new connection → Name `visora`, Label `Visora`, Type **API Key** (Make calls this `basic` internally).
   - **Parameters** tab: paste the array from `connection.json`.
   - **Communication** tab: paste `connection.communication.json`. This validates the key against `GET /api/v1/whoami` (added to the render worker specifically for this) — no render, no quota used, just confirms the key works.
4. **RPC (template picker).**
   - Add a new RPC → Name `listTemplates`, Label `List Templates`.
   - **Parameters** tab: leave it `[]` (this RPC takes no input).
   - **Communication** tab: paste `rpcs/list-templates.communication.json`. Calls `GET /api/v1/templates` and turns the result into `{value, label}` pairs.
5. **Module: Render Image.**
   - Add a new module → Name `renderImage`, Label `Render Image`, Type **Action**, Connection `visora`.
   - **Static Parameters** tab: leave it `[]` — nothing goes here, these fields need to be mappable from other modules.
   - **Mappable Parameters** tab: paste the array from `modules/render-image.json`.
   - **Communication** tab: paste `modules/render-image.communication.json`.
   - **Interface** tab: paste `modules/render-image.interface.json`.
6. **Save + publish** as a private app — no need to submit to Make's public directory to use it in your own scenarios (same idea as sideloading the WordPress plugin zip before it clears review).

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
increment `usage_this_month` (only an actual render does) — check the
render worker's `handleWhoami`/`handleListTemplates` if that behavior
ever needs to change.
