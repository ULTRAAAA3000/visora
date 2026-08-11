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

export default function Terms() {
  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-sm text-[#D7E2EA]/50 mb-14">Last updated: [DATE].</p>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 mb-14 text-sm text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Placeholder notice:</strong> legal entity name, registered
          address, and governing jurisdiction below need real values, and this draft should be reviewed by a
          lawyer before launch — particularly the liability and refund sections, which vary a lot by
          jurisdiction and by what your payment provider requires.
        </div>

        <Section title="1. What these terms cover">
          <p>
            These terms govern your use of Visora — the dashboard, API, and any connected integration
            (WordPress plugin, Telegram bot, Make.com app, browser extension) — operated by [LEGAL ENTITY
            NAME]. By creating an account, you agree to them.
          </p>
        </Section>

        <Section title="2. Your account">
          <p>
            You're responsible for your account credentials and API key, and for what happens under your
            account — including through any integration you've connected it to. If you think your API key
            leaked, regenerate it immediately from the dashboard.
          </p>
        </Section>

        <Section title="3. Acceptable use">
          <p>You may not use Visora to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Render content that's illegal, infringing, or that you don't have rights to</li>
            <li>Attempt to circumvent your plan's quota or rate limits</li>
            <li>Resell raw API access without a separate agreement with us</li>
            <li>Attack, disrupt, or reverse-engineer the render infrastructure itself</li>
          </ul>
          <p>We can suspend accounts that violate this, with notice where practical.</p>
        </Section>

        <Section title="4. Your content">
          <p>
            You own the templates you create and the images they produce. We need a limited license to store
            and process them — that's it, purely to run the service (see the{' '}
            <a href="/privacy" className="text-white underline underline-offset-2">
              Privacy Policy
            </a>{' '}
            for what that means in practice).
          </p>
        </Section>

        <Section title="5. Plans, billing, and cancellation">
          <p>
            Paid plans renew automatically until cancelled. Cancelling stops future renewals; it doesn't
            retroactively refund the current billing period unless required by law or stated otherwise at
            checkout. [Confirm refund policy specifics once the Paddle/Dodo Payments migration is final —
            those providers may impose their own requirements here.]
          </p>
        </Section>

        <Section title="6. Uptime and changes">
          <p>
            We aim for high availability but don't guarantee it — Visora depends on third-party infrastructure
            (Cloudflare, Supabase) outside our direct control. We may change or discontinue features with
            reasonable notice where practical.
          </p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>
            Visora is provided "as is." To the extent permitted by law, [LEGAL ENTITY NAME] isn't liable for
            indirect, incidental, or consequential damages arising from your use of the service. [This section
            needs jurisdiction-specific legal review — liability limitations that are enforceable vary
            significantly by country/state.]
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            You can delete your account at any time. We can suspend or terminate accounts for violating
            section 3, non-payment, or if required by law.
          </p>
        </Section>

        <Section title="9. Governing law">
          <p>These terms are governed by the laws of [JURISDICTION].</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions about these terms: [LEGAL CONTACT EMAIL].</p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}
