import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import type { ReactNode } from 'react';
import { usePageMeta } from '../../lib/usePageMeta';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-3 text-[#D7E2EA]/75 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export default function Privacy() {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'What data Visora collects, which third parties process it (Supabase, Cloudflare, our payment provider), and how to exercise your rights.',
    path: '/privacy',
  });

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-[#D7E2EA]/50 mb-14">
          Last updated: August 13, 2026. Applies to visor-a.com and its dashboard, API, and connected
          integrations (WordPress plugin, Telegram bot, Make.com app, browser extension).
        </p>

        <Section title="Who this is">
          <p>
            Visora is operated out of Ukraine. For anything in this policy, contact{' '}
            <a href="mailto:visora.image@gmail.com" className="text-white underline underline-offset-2">
              visora.image@gmail.com
            </a>
            .
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
            currently use LemonSqueezy, transitioning to a new payment provider soon.
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
              <strong className="text-white">LemonSqueezy</strong> — payment processing for paid plans
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
            We use Google Analytics 4 to understand aggregate traffic and usage — which pages get visited, roughly
            how many people, that kind of thing. It sets cookies (<code>_ga</code>, <code>_ga_*</code>) and
            processes data per{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2"
            >
              Google's own privacy policy
            </a>
            . We haven't enabled Google Signals or any ad-personalization features, so this is traffic
            measurement only — not cross-site ad tracking. No analytics runs on the render API itself, only on
            the marketing site and dashboard.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Account data is kept as long as your account is active. Rendered images are cached for
            performance and may persist in storage after a render; deleting a template doesn't retroactively
            delete images already generated from it. Request deletion at{' '}
            <a href="mailto:visora.image@gmail.com" className="text-white underline underline-offset-2">
              visora.image@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can access, export, or request deletion of your account data at any time by contacting{' '}
            <a href="mailto:visora.image@gmail.com" className="text-white underline underline-offset-2">
              visora.image@gmail.com
            </a>
            . Depending on your location, you may have additional rights under laws like GDPR or CCPA;
            Visora is operated out of Ukraine, and this policy is governed by Ukrainian law.
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
