// Static HTML snapshots served only to crawlers (see bots.ts). Content here
// is copied verbatim from the real React components — src/components/landing/
// VisoraHero.tsx, AboutSection.tsx, ServicesSection.tsx, PricingSection.tsx,
// src/pages/marketing/Docs.tsx, GuideBody.tsx, TemplatesPublic.tsx — so this
// never says anything the live site doesn't. When that copy changes, update
// this file too.

const SHARED_HEAD = `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Visora" />
  <meta property="og:image" content="https://visor-a.com/og-image.png" />
`;

export function aboutSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>About — Visora</title>
  <meta name="description" content="Why Visora exists, how it actually renders images, and who builds it — a small, API-first tool for developers who need brand-accurate images at scale." />
</head>
<body>
  <main>
    <p>About</p>
    <h1>Images your brand never gets wrong.</h1>

    <h2>Why Visora exists</h2>
    <p>Most "generate an image" tools today are a diffusion model guessing at pixels — close enough for a mood board, not close enough for a logo that has to land in the exact same spot on every single render. Brand assets, product banners, certificates — anything with a fixed layout — need to be exact, not approximately right.</p>
    <p>Visora exists to be the boring, reliable version of that: give it a template and some data, get back the same pixel-perfect image every time, because it isn't generating anything — it's rendering real HTML and Tailwind CSS in a real browser and taking a screenshot.</p>

    <h2>How it actually works</h2>
    <p>Under the hood, every render spins up a real headless Chromium instance (via Cloudflare's Browser Rendering), loads your template with the data filled in, and screenshots it. That means anything CSS can do — gradients, custom fonts, flexbox and grid layouts, Tailwind utility classes — renders exactly as it would in a browser, because it is a browser. No model in the loop, nothing to hallucinate.</p>
    <p>Identical requests are served from cache instead of re-rendering, so the same template with the same data comes back in milliseconds on repeat calls — and the image URL stays stable until you actually change the template.</p>

    <h2>Who's behind it</h2>
    <p>Visora is built and operated out of Ukraine as a small, independent, API-first product — not a venture-backed platform with a growth team.</p>

    <h2>Get in touch</h2>
    <p>Questions, bug reports, feature requests, or partnership inquiries — reach out via the contact page. Or take a look at the API docs and template gallery to see what it can do.</p>

    <nav>
      <a href="/">Home</a>
      <a href="/docs">API documentation</a>
      <a href="/contact">Contact</a>
    </nav>
  </main>
</body>
</html>`;
}

export function homepageSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>Visora — Images your brand never gets wrong.</title>
  <meta name="description" content="Turn HTML and Tailwind templates into OG images, product banners, and certificates — rendered by real Chromium, not a language model guessing at pixels." />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Visora",
    "url": "https://visor-a.com/",
    "description": "API-first tool that turns HTML and Tailwind templates into images — OG images, product banners, certificates — rendered by real headless Chromium, not a language model guessing at pixels.",
    "applicationCategory": "DeveloperApplication",
    "offers": [
      { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD", "description": "500 renders/month, 1 API key" },
      { "@type": "Offer", "name": "Pro", "price": "19", "priceCurrency": "USD", "description": "20,000 renders/month, 5 API keys, 4K output, webhooks" },
      { "@type": "Offer", "name": "Agency", "price": "49", "priceCurrency": "USD", "description": "100,000 renders/month, unlimited API keys, agency-exclusive templates, priority queue" }
    ]
  }
  </script>
</head>
<body>
  <main>
    <h1>Images your brand never gets wrong.</h1>
    <p>Turn HTML and Tailwind templates into OG images, product banners, and certificates — rendered by real Chromium, not a language model guessing at pixels.</p>
    <ul>
      <li>&lt; 150ms renders</li>
      <li>Pixel-exact, every time</li>
      <li>One POST request</li>
    </ul>

    <h2>About Visora</h2>
    <p>Visora renders pixel-perfect OG images, product banners, certificates, and social cards from HTML and Tailwind templates — using real headless Chromium, not a language model guessing at pixels. Built for developers who need brand-accurate images at scale, in under 150 milliseconds, via one API call.</p>

    <h2>What you can render</h2>
    <ul>
      <li><strong>OG Images</strong> — Auto-generate social share images for every blog post, product page, or listing — pixel-exact every time.</li>
      <li><strong>Product Banners</strong> — E-commerce banners, discount tags, and marketing creatives rendered straight from your product data.</li>
      <li><strong>Certificates &amp; Badges</strong> — Course completions, achievements, and credentials — issued as branded, verifiable images.</li>
      <li><strong>Social Cards</strong> — Quote cards, announcement graphics, and podcast covers ready to post the moment content ships.</li>
      <li><strong>Developer API</strong> — One POST request, one JSON payload, one image URL back — deploy in minutes, not sprints.</li>
    </ul>

    <h2>Pricing</h2>
    <ul>
      <li><strong>Free</strong> — $0 forever — 500 renders/month, 1 API key, 1 concurrent render, 1 team seat, Visora badge watermark, community support.</li>
      <li><strong>Pro</strong> — $19/month — 20,000 renders/month, 5 API keys, 5 concurrent renders, 3 team seats, 4K output, custom fonts, no watermark, webhooks, email support.</li>
      <li><strong>Agency</strong> — $49/month — 100,000 renders/month, unlimited API keys, 20 concurrent renders, unlimited team seats, agency-exclusive templates, priority render queue, priority + Slack support.</li>
    </ul>
    <p>All tiers include real Chromium rendering and custom HTML/Tailwind templates.</p>

    <h2>Integrations</h2>
    <ul>
      <li>WordPress plugin — <code>[visora_render]</code> shortcode</li>
      <li>Make.com app — Render Image action</li>
      <li>Telegram bot</li>
      <li>Chrome/Firefox browser extension</li>
    </ul>

    <nav>
      <a href="/docs">API documentation</a>
      <a href="/guide">Getting started guide</a>
      <a href="/templates">Template gallery</a>
      <a href="/signup">Sign up</a>
      <a href="/contact">Contact</a>
    </nav>
  </main>
</body>
</html>`;
}

export function docsSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>API Documentation · Visora</title>
  <meta name="description" content="Full Visora API reference: authentication, the render endpoint, request/response shapes, error codes, rate limits, webhooks, and no-code integrations." />
  <link rel="canonical" href="https://visor-a.com/docs" />
</head>
<body>
  <main>
    <h1>API Documentation</h1>
    <p>Everything you need to call the Visora render API directly, plus the no-code integrations if you'd rather not.</p>

    <h2>Authentication</h2>
    <p>Every request needs your API key as a Bearer token: <code>Authorization: Bearer VISORA_LIVE_...</code>. Find your key on your dashboard.</p>

    <h2>Render endpoint</h2>
    <p><code>POST /api/v1/render</code> — the one endpoint that does everything.</p>
    <pre>curl -X POST https://api.visor-a.com/api/v1/render \\
  -H "Authorization: Bearer VISORA_LIVE_..." \\
  -H "Content-Type: application/json" \\
  -d '{"template_id": "product-banner", "format": "png", "data": {"title": "Air Max 270", "price": "$150"}}'</pre>

    <h2>Request body</h2>
    <ul>
      <li><strong>template_id</strong> — a preset ID from the template gallery, or your own custom template.</li>
      <li><strong>format</strong> — png or jpeg.</li>
      <li><strong>data</strong> — an object of variables filling in the template's blanks.</li>
    </ul>

    <h2>Response</h2>
    <p>200 OK with a JSON body: <code>{ success, render_time, cached, data: { url, width, height, format } }</code>. Identical requests are served from cache — <code>cached: true</code> — instead of re-rendering.</p>

    <h2>Errors</h2>
    <p>400 (bad request), 401 (invalid API key), 404 (template not found), 429 (monthly quota exceeded), 500 (render failed).</p>

    <h2>Rate limits &amp; quota</h2>
    <p>Your plan's monthly render quota and current usage are visible on your dashboard. Requests past the quota return 429 until it resets or you upgrade.</p>

    <h2>Webhooks</h2>
    <p>On Pro and Agency, set a webhook URL from your dashboard and Visora POSTs a <code>render.completed</code> event there on every render, signed with HMAC-SHA256 (<code>X-Visora-Signature</code> header) so you can verify it's really from Visora.</p>

    <h2>Integrations</h2>
    <ul>
      <li>Make.com — a Render Image action for any scenario.</li>
      <li>WordPress — one-click connect plus a <code>[visora_render]</code> shortcode.</li>
      <li>Telegram bot — render templates with a <code>/render</code> command, right from chat.</li>
      <li>Browser extension — right-click selected text on any page to render it (in testing).</li>
    </ul>

    <nav>
      <a href="/guide">Plain-language guide</a>
      <a href="/templates">Template gallery</a>
      <a href="/signup">Sign up</a>
      <a href="/">Home</a>
    </nav>
  </main>
</body>
</html>`;
}

export function guideSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>Getting Started Guide · Visora</title>
  <meta name="description" content="Three ways to use Visora — by hand, no-code automation, or the API — written for anyone, whether you've never used an API or have your own developer." />
  <link rel="canonical" href="https://visor-a.com/guide" />
</head>
<body>
  <main>
    <h1>Using Visora, start to finish</h1>
    <p>Written for anyone — whether you're comfortable with APIs or have never written a line of code.</p>

    <h2>What Visora actually does</h2>
    <p>You give Visora a template — a design with blanks in it, like "product name" or "price" — and some data to fill those blanks with. Visora hands back a finished image. A real browser (headless Chromium) takes a screenshot of a real web page built from your template — no AI guessing what your logo should look like.</p>

    <h2>Three ways to use Visora</h2>
    <p>Whichever way you do it, the result is always the same: a link to a finished image. What changes is who's typing the request.</p>
    <h3>1. By hand — you need one image, right now</h3>
    <p>Open the Telegram bot and use <code>/render</code> with a template and your data, or right-click selected text on any webpage → "Render with Visora".</p>
    <h3>2. No-code automation — set it up once, it runs itself</h3>
    <p>Running WordPress? Install the plugin, drop a <code>[visora_render]</code> shortcode into a page. Prefer Make.com? Drag together a scenario — no code at all.</p>
    <h3>3. A real API — for developers, fully automatic at scale</h3>
    <p>Your own program sends a request to Visora with your key and data, and gets an image URL back in a fraction of a second. This is what a client with their own developer uses, thousands of times a day.</p>

    <h2>Getting started</h2>
    <p>Create a free account, find your API key on the dashboard, and pick a template from the gallery — free, no credit card required.</p>

    <h2>Don't want to write code?</h2>
    <p>WordPress plugin, Make.com scenario, Telegram bot, or the browser extension (in testing) — see the Integrations section of the API docs for each.</p>

    <h2>For developers: the actual API call</h2>
    <pre>curl -X POST https://api.visor-a.com/api/v1/render \\
  -H "Authorization: Bearer VISORA_LIVE_..." \\
  -H "Content-Type: application/json" \\
  -d '{"template_id": "product-banner", "data": {"title": "Air Max 270", "price": "$150"}}'</pre>

    <nav>
      <a href="/docs">Full API reference</a>
      <a href="/templates">Template gallery</a>
      <a href="/signup">Sign up</a>
      <a href="/">Home</a>
    </nav>
  </main>
</body>
</html>`;
}

export function templatesSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>Template Gallery · Visora</title>
  <meta name="description" content="30+ ready-made templates for OG images, product banners, certificates, and social cards — Free, Pro, and Agency-exclusive designs, usable with no HTML/CSS writing required." />
  <link rel="canonical" href="https://visor-a.com/templates" />
</head>
<body>
  <main>
    <h1>Template gallery</h1>
    <p>30+ preset templates, organized Free / Pro / Agency. Use any of them by <code>template_id</code> — no HTML or CSS writing required — or build your own from scratch.</p>

    <h2>Categories</h2>
    <ul>
      <li>OG images — social share images for blog posts, product pages, listings.</li>
      <li>Product banners — e-commerce banners, discount tags, marketing creatives.</li>
      <li>Certificates &amp; badges — course completions, achievements, credentials.</li>
      <li>Social &amp; podcast assets — quote cards, announcement graphics, podcast covers.</li>
      <li>Agency-exclusive — designs only available on the Agency plan.</li>
    </ul>

    <p>Every preset is rendered the same way as a custom template: real headless Chromium, pixel-exact, in under 150ms.</p>

    <nav>
      <a href="/docs">API documentation</a>
      <a href="/guide">Getting started guide</a>
      <a href="/signup">Sign up</a>
      <a href="/">Home</a>
    </nav>
  </main>
</body>
</html>`;
}

export function changelogSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>Changelog · Visora</title>
  <meta name="description" content="What's shipped in Visora, in order — new templates, API features, integrations, and fixes." />
  <link rel="canonical" href="https://visor-a.com/changelog" />
</head>
<body>
  <main>
    <h1>What's new in Visora</h1>
    <p>A running log of shipped features, template additions, and fixes. See the live page for the full, up-to-date list.</p>
    <nav>
      <a href="/docs">API documentation</a>
      <a href="/">Home</a>
    </nav>
  </main>
</body>
</html>`;
}

export function contactSnapshot(): string {
  return `<!doctype html>
<html lang="en">
<head>
${SHARED_HEAD}
  <title>Contact · Visora</title>
  <meta name="description" content="Questions, bug reports, feature requests, or partnership inquiries — reach the Visora team directly." />
  <link rel="canonical" href="https://visor-a.com/contact" />
</head>
<body>
  <main>
    <h1>Get in touch</h1>
    <p>Questions, bug reports, feature requests, partnership stuff — reach us at <a href="mailto:visora.image@gmail.com">visora.image@gmail.com</a> or use the contact form on the live page.</p>
    <nav>
      <a href="/">Home</a>
    </nav>
  </main>
</body>
</html>`;
}
