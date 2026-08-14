// Static HTML snapshots served only to crawlers (see bots.ts). Content here
// is copied verbatim from the real React components — src/components/landing/
// VisoraHero.tsx, AboutSection.tsx, ServicesSection.tsx, PricingSection.tsx —
// so this never says anything the live site doesn't. When that copy changes,
// update this file too.

const SHARED_HEAD = `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Visora" />
  <meta property="og:image" content="https://visor-a.com/og-image.png" />
`;

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
