# Visora browser extension

Render templates from the toolbar, or right-click selected text on any
page → "Render with Visora" to pre-fill a field with it.

Unlike the WordPress plugin and Telegram bot, this doesn't use the
`/connect` handshake — Chrome/Firefox extension IDs aren't stable until
published to a store, so a redirect-back flow isn't reliable yet. For
now you paste your API key in directly (same pattern as the Make.com
connection): open the popup, paste the key from your dashboard, done.
A one-click connect can be added later once this has a fixed
extension ID from being published.

## What's in this folder

- `manifest.json` — single manifest that loads in both Chrome and
  Firefox (MV3). Each browser reads the background key it understands
  (`service_worker` for Chrome, `scripts` for Firefox) and ignores the
  other; `browser_specific_settings` is Chrome-ignored, Firefox-required.
- `background.js` — creates the right-click context menu item.
- `popup.html` / `popup.js` / `popup.css` — the whole UI: connect, pick
  a template, fill in its fields, render, copy/open the result.
- `icons/` — generated from the site's chevron mark.

## Install in Chrome (unpacked, for testing)

1. `chrome://extensions`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → select `integrations/browser-extension/`
4. Pin it to the toolbar if you want it visible

## Install in Firefox (temporary, for testing)

1. `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Select `integrations/browser-extension/manifest.json`

Firefox temporary add-ons are removed when the browser closes — for
anything longer-lived it needs to go through `about:addons` with a
signed build (see Publishing below).

## First use

1. Click the toolbar icon → **"Where do I find my API key?"** opens
   your Visora dashboard.
2. Copy the key, paste it into the popup, hit **Connect** — this
   validates it against `/api/v1/whoami` before saving, so a typo
   fails immediately instead of on your first render.
3. Pick a template, fill in the fields (pre-filled with the template's
   defaults), **Render**.

**Advanced settings** (collapsed by default) lets you point `Visora
app URL` / `Render API URL` somewhere other than the current
`*.workers.dev` / `*.pages.dev` defaults — needed once the custom
domain migration (main roadmap item 8) happens. Saving a URL outside
the manifest's declared `host_permissions` triggers a one-time browser
permission prompt (MV3 requirement).

## Publishing (later, not done yet)

- **Chrome Web Store**: zip this folder, submit at
  https://chrome.google.com/webstore/devconsole — one-time $5 developer
  fee, review typically a few days.
- **Firefox Add-ons (AMO)**: submit at
  https://addons.mozilla.org/developers/ — free, automated + manual
  review.

Once published, both give a stable ID — that's when a real one-click
`/connect` handshake (like the WordPress plugin's) becomes possible
instead of manual key paste.
