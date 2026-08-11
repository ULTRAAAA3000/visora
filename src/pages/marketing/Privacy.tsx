import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import type { ReactNode } from 'react';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-3 text-[#D7E2EA]/75 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-[#D7E2EA]/50 mb-14">
          Last updated: [DATE]. Applies to visora.io and its dashboard, API, and connected integrations
          (WordPress plugin, Telegram bot, Make.com app, browser extension).
        </p>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 mb-14 text-sm text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Placeholder notice:</strong> this page describes what Visora
          actually does with data today, but the bracketed fields — legal entity name, registered address,
          governing jurisdiction — need to be filled in with real details, and this draft reviewed by a
          lawyer before it's relied on for compliance (GDPR, CCPA, or otherwise) in your jurisdiction.
        </div>

        <Section title="Who this is">
          <p>
            Visora is operated by [LEGAL ENTITY NAME], [REGISTERED ADDRESS]. For anything in this policy,
            contact [PRIVACY CONTACT EMAIL].
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="text-white">Account data:</strong> the email address and password you sign up
            with (passwords are hashed by our authentication provider, Supabase — we never see or store them
            in plain text).
          </p>
          <p>
            <strong className="text-white">Templates and render data:</strong> the HTML/Tailwind templates you
            create, and the data values you send when rendering them (e.g. a product title or price). This is
            necessary to produce the image you're requesting.
          </p>
          <p>
            <strong className="text-white">Usage data:</strong> render counts, timestamps, and status codes,
            used to enforce your plan's monthly quota and for our own debugging.
          </p>
          <p>
            <strong className="text-white">Payment data:</strong> if you're on a paid plan, our payment
            provider handles your card details directly — we never see or store full card numbers. We
            currently use LemonSqueezy, transitioning to [Paddle/Dodo Payments].
          </p>
        </Section>

        <Section title="Third parties we rely on">
          <p>Visora is built on other companies' infrastructure. Data passes through:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">Supabase</strong> — database and authentication
            </li>
            <li>
              <strong className="text-white">Cloudflare</strong> — hosting, the render engine (Workers +
              Browser Rendering), and image storage (R2)
            </li>
            <li>
              <strong className="text-white">[Paddle / Dodo Payments]</strong> — payment processing for paid
              plans
            </li>
          </ul>
          <p>
            If you connect an integration (WordPress, Telegram, Make.com, browser extension), your API key is
            also held by that integration on your own device or your own WordPress site — Visora doesn't
            control that copy once it's connected.
          </p>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We don't sell your data to anyone.</li>
            <li>We don't use your template content or render data to train any AI model.</li>
            <li>We don't share your data with advertisers.</li>
          </ul>
        </Section>

        <Section title="Cookies & analytics">
          <p>
            [Describe analytics tooling here once added — e.g. "We use [Plausible/PostHog/GA4], which
            [does/doesn't] use cookies, to understand aggregate traffic. No cross-site tracking."]
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Account data is kept as long as your account is active. Rendered images are cached for
            performance and may persist in storage after a render; deleting a template doesn't retroactively
            delete images already generated from it. Request deletion at [PRIVACY CONTACT EMAIL].
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can access, export, or request deletion of your account data at any time by contacting
            [PRIVACY CONTACT EMAIL]. Depending on your location, you may have additional rights under laws
            like GDPR or CCPA — [expand this section once jurisdiction is confirmed].
          </p>
        </Section>

        <Section title="Children">
          <p>Visora isn't directed at children under 16, and we don't knowingly collect their data.</p>
        </Section>

        <Section title="Changes">
          <p>
            We'll update the "Last updated" date above when this changes materially, and — where required —
            notify account holders by email.
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}
