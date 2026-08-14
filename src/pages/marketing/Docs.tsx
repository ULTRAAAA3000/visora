import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import { usePageMeta } from '../../lib/usePageMeta';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-white/[0.04] border border-white/10 rounded-xl p-5 overflow-x-auto text-sm font-mono text-[#D7E2EA] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 mb-16">
      <h2 className="text-2xl font-semibold text-white mb-5">{title}</h2>
      <div className="space-y-4 text-[#D7E2EA]/80 leading-relaxed">{children}</div>
    </section>
  );
}

const TOC = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'endpoint', label: 'Render endpoint' },
  { id: 'request', label: 'Request body' },
  { id: 'response', label: 'Response' },
  { id: 'errors', label: 'Errors' },
  { id: 'rate-limits', label: 'Rate limits & quota' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'integrations', label: 'Integrations' },
];

export default function Docs() {
  usePageMeta({
    title: 'API Documentation',
    description:
      'Full Visora API reference: authentication, the render endpoint, request/response shapes, error codes, rate limits, webhooks, and no-code integrations.',
    path: '/docs',
  });

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24 flex gap-16">
        {/* Table of contents */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-32">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-4">On this page</p>
            <ul className="space-y-3">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-sm text-[#D7E2EA]/60 hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">API Reference</p>
          <h1 className="text-4xl font-bold text-white mb-4">Render API</h1>
          <p className="text-lg text-[#D7E2EA]/70 mb-4">
            One endpoint. Send a template ID and your data, get back a CDN-hosted image URL — rendered by real
            headless Chromium, typically in under 150ms.
          </p>
          <p className="text-sm text-white/40 mb-16">
            All requests go to <code className="text-white/60">api.visor-a.com</code>.
          </p>

          <Section id="authentication" title="Authentication">
            <p>
              Every request needs your API key in the <code className="text-white">Authorization</code> header,
              as a Bearer token. Get your key from the{' '}
              <a href="/dashboard" className="text-white underline underline-offset-2">
                dashboard
              </a>{' '}
              after signing up.
            </p>
            <CodeBlock>{`Authorization: Bearer VISORA_LIVE_...`}</CodeBlock>
          </Section>

          <Section id="endpoint" title="Render endpoint">
            <p>
              <code className="text-white">POST</code>{' '}
              <code className="text-white">https://api.visor-a.com/api/v1/render</code>
            </p>
            <p>Renders a template with your data and returns a JSON response containing the image URL.</p>
          </Section>

          <Section id="request" title="Request body">
            <CodeBlock>{`{
  "template_id": "tpl_ecom_v1",
  "format": "png",
  "data": {
    "title": "Nike Air Max 270",
    "price": "3,499 UAH"
  }
}`}</CodeBlock>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>
                <code className="text-white">template_id</code> — required. The ID of one of your templates
                (presets or custom).
              </li>
              <li>
                <code className="text-white">format</code> — optional. <code className="text-white">"png"</code>{' '}
                (default) or <code className="text-white">"jpeg"</code>.
              </li>
              <li>
                <code className="text-white">data</code> — optional. Key/value pairs filling in the template's{' '}
                <code className="text-white">{'{{variables}}'}</code>. Falls back to the template's default
                values for anything you don't pass.
              </li>
            </ul>
          </Section>

          <Section id="response" title="Response">
            <p>
              <code className="text-white">200 OK</code>
            </p>
            <CodeBlock>{`{
  "success": true,
  "render_time": "89ms",
  "cached": false,
  "data": {
    "url": "https://api.visor-a.com/renders/cache/3f9a…c2.png",
    "width": 1200,
    "height": 630,
    "format": "png"
  }
}`}</CodeBlock>
            <p>
              Identical requests — same template, same <code className="text-white">data</code>, same{' '}
              <code className="text-white">format</code> — are served from cache instead of re-rendering, and{' '}
              <code className="text-white">cached</code> comes back <code className="text-white">true</code>. The{' '}
              <code className="text-white">url</code> is stable for as long as the template stays unchanged, so
              it's safe to store and reuse rather than re-requesting each time. Editing the template invalidates
              its cache automatically.
            </p>
          </Section>

          <Section id="errors" title="Errors">
            <p>Errors return the relevant HTTP status with a JSON body:</p>
            <CodeBlock>{`{ "success": false, "error": "Template not found." }`}</CodeBlock>
            <table className="w-full mt-4 text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10">
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-2 text-white">400</td>
                  <td className="py-2">Missing or invalid JSON body / missing template_id</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">401</td>
                  <td className="py-2">Missing, malformed, or invalid API key</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">404</td>
                  <td className="py-2">Template not found</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">429</td>
                  <td className="py-2">Monthly render quota exceeded</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">500</td>
                  <td className="py-2">Render failed (malformed template HTML, etc.)</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section id="rate-limits" title="Rate limits & quota">
            <p>
              Your plan's monthly render quota and current usage are visible on your{' '}
              <a href="/dashboard" className="text-white underline underline-offset-2">
                dashboard overview
              </a>
              . Once you hit the quota, requests return{' '}
              <code className="text-white">429 Monthly render quota exceeded</code> until it resets next month or
              you upgrade your plan.
            </p>
          </Section>

          <Section id="webhooks" title="Webhooks">
            <p>
              On Pro and Agency, set a webhook URL from your{' '}
              <a href="/dashboard" className="text-white underline underline-offset-2">
                dashboard overview
              </a>{' '}
              and we'll <code className="text-white">POST</code> a <code className="text-white">render.completed</code>{' '}
              event there every time a render finishes — no polling needed.
            </p>
            <CodeBlock>{`{
  "event": "render.completed",
  "data": {
    "template_id": "…",
    "image_url": "https://…/renders/cache/3f9a…c2.png",
    "width": 1200,
    "height": 630,
    "format": "png",
    "render_time_ms": 842
  },
  "timestamp": "2026-08-09T12:00:00.000Z"
}`}</CodeBlock>
            <p>
              Every request carries an <code className="text-white">X-Visora-Signature: sha256=…</code> header — an
              HMAC-SHA256 of the raw request body, signed with the secret shown next to your webhook URL in the
              dashboard. Verify it before trusting the payload:
            </p>
            <CodeBlock>{`const expected = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawRequestBody) // the raw bytes, not JSON.parse()'d and re-stringified
  .digest('hex');

if (\`sha256=\${expected}\` !== req.headers['x-visora-signature']) {
  return res.status(401).send('Invalid signature');
}`}</CodeBlock>
            <p>
              Delivery is best-effort and not retried — if your endpoint is down or slow, that event is dropped.
              Use the "Send test event" button in the dashboard to check your handler without spending a real
              render on it.
            </p>
          </Section>

          <Section id="integrations" title="Integrations">
            <p>
              Prefer not to call the API directly? Visora plugs into the tools you already use — see the{' '}
              <a href="/guide#three-ways" className="text-white underline underline-offset-2">
                plain-language guide
              </a>{' '}
              if you're not a developer.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              <a
                href="https://www.make.com/en/hq/app-invitation/c829875c4efa7de56651bf14f41b93bd"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-colors"
              >
                <p className="text-white font-medium mb-1">Make.com</p>
                <p className="text-sm text-[#D7E2EA]/60">
                  A Render Image action for any scenario — pick a template, map your data, get an image URL back.
                </p>
              </a>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-white font-medium mb-1">WordPress</p>
                <p className="text-sm text-[#D7E2EA]/60">
                  One-click connect from Settings → Visora, plus a <code className="text-white/80">[visora_render]</code>{' '}
                  shortcode. Available as a direct download while it clears the plugin directory review.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-white font-medium mb-1">Telegram bot</p>
                <p className="text-sm text-[#D7E2EA]/60">
                  Connect your account and render templates with a <code className="text-white/80">/render</code>{' '}
                  command, right from chat. Live now.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-white font-medium mb-1">Browser extension</p>
                <p className="text-sm text-[#D7E2EA]/60">
                  Right-click selected text on any page → "Render with Visora". In testing — not yet in the
                  Chrome/Firefox stores.
                </p>
              </div>
            </div>
          </Section>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm text-white/50 mb-2">Full example</p>
            <CodeBlock>{`curl -X POST https://api.visor-a.com/api/v1/render \\
  -H "Authorization: Bearer VISORA_LIVE_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tpl_ecom_v1",
    "data": { "title": "Nike Air Max 270" }
  }'`}</CodeBlock>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
