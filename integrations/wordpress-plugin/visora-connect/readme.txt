=== Visora Connect ===
Contributors: ultraaaa3000
Tags: og image, social image, image generation, banner, certificate
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect your WordPress site to Visora and render pixel-perfect OG images, product banners, and certificates from HTML/Tailwind templates — real headless Chromium, not an AI model guessing at pixels.

== Description ==

Visora is an API-first service that turns HTML/Tailwind templates into
dynamic images: OpenGraph share images, e-commerce product banners,
certificates, and more. This plugin gets your WordPress site connected
in one click and gives you a `[visora_render]` shortcode to drop
rendered images anywhere.

**What this plugin does:**

1. **Connect** — click one button, log in (or sign up) on visor-a.com,
   approve, and your API key is saved automatically. No copy-pasting
   keys between tabs.
2. **Render** — use `[visora_render template="tpl_id" title="..."]`
   anywhere shortcodes work. The call happens server-side, so your API
   key never reaches the visitor's browser, and results are cached so
   repeat page views don't re-render.

**What this plugin doesn't do (yet):** browse/pick templates visually,
or auto-generate OG tags from post content. Manage templates from your
Visora dashboard for now — a template-picker UI is on the roadmap.

== Installation ==

1. Upload the `visora-connect` folder to `/wp-content/plugins/`, or
   install the zip through Plugins > Add New > Upload Plugin.
2. Activate the plugin.
3. Go to Settings > Visora and click "Connect to Visora".

== Frequently Asked Questions ==

= Where does my API key go? =

It's saved as a WordPress option on your own site and only ever sent
from your server to Visora's render API (server-side, via
`wp_remote_post`) — never to the visitor's browser.

= Can I use a template ID without the shortcode? =

Yes — call `visora_get_option('visora_api_key')` and
`visora_get_option('visora_api_url')` from your own PHP and hit
`{api_url}/api/v1/render` directly, same as the shortcode does.

== External services ==

This plugin connects to the Visora API (api.visor-a.com) to render images from HTML/Tailwind templates. It is a required part of the plugin's functionality — without it, no images can be rendered.

**Connect flow (Settings > Visora):** when you click "Connect to Visora", your browser is redirected to visor-a.com to log in or sign up. On approval, your site receives an API key which is stored locally as a WordPress option. No content from your site is sent during this step.

**Rendering (`[visora_render]` shortcode):** each time the shortcode is used and no cached result exists, your site's server sends a request to `https://api.visor-a.com/api/v1/render` containing: your API key (for authentication), the template ID, and the shortcode's attributes (the template data you explicitly provide, e.g. title/price/text passed in the shortcode). This request is server-side only; the API key is never exposed to site visitors. Successful responses (an image URL) are cached in a WordPress transient for 24 hours to avoid repeat calls.

Visora: https://visor-a.com — [Terms of Service](https://visor-a.com/terms) — [Privacy Policy](https://visor-a.com/privacy)

== Changelog ==

= 1.0.1 =
* Documented external service usage (Visora API) per WordPress.org guidelines.

= 1.0.0 =
* Initial release: one-click connect flow + `[visora_render]` shortcode.
