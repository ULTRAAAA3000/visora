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

/**
 * Paddle (our merchant of record) reviews this page as part of seller
 * verification, and its own guidance is specific: a refund policy with
 * qualifiers ("except for abuse", "minus fees", "after usage review")
 * reads as a liability risk to them and gets bounced back for
 * revision, since Paddle — not us — eats the chargeback if a dispute
 * goes wrong. So the guarantee below is deliberately a clean, flat
 * statement with no carve-outs. The only real nuance (renewals aren't
 * separately guaranteed, cancel any time instead) is a standard
 * structural distinction, not a hidden qualifier on the guarantee
 * itself.
 */
export default function RefundPolicy() {
  usePageMeta({
    title: 'Refund Policy',
    description: '14-day money-back guarantee on your first payment for Visora Pro or Agency, no questions asked.',
    path: '/refund',
  });

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-white mb-3">Refund Policy</h1>
        <p className="text-sm text-[#D7E2EA]/50 mb-14">Last updated: August 15, 2026. Applies to Visora Pro and Agency subscriptions.</p>

        <Section title="14-day money-back guarantee">
          <p>
            If you're not satisfied with Visora within 14 days of your first payment for Pro or Agency, contact us
            at{' '}
            <a href="mailto:visora.image@gmail.com" className="text-white underline underline-offset-2">
              visora.image@gmail.com
            </a>{' '}
            or through our{' '}
            <a href="/contact" className="text-white underline underline-offset-2">
              contact page
            </a>{' '}
            for a full refund. No questions asked.
          </p>
        </Section>

        <Section title="How it works">
          <ul className="list-disc pl-5 space-y-2">
            <li>The guarantee covers your first payment on a new subscription to a paid plan.</li>
            <li>Request it within 14 days of that payment — we'll refund it in full.</li>
            <li>Refunds are issued to your original payment method and typically appear within 5–10 business days, depending on your bank or card provider.</li>
          </ul>
        </Section>

        <Section title="Renewals and cancelling">
          <p>
            Later monthly renewal payments aren't covered by the guarantee above, but you can cancel your
            subscription at any time from your dashboard. Cancelling stops future renewals — it takes effect at
            the end of your current billing period, so you keep access until then and are never charged again
            after that.
          </p>
        </Section>

        <Section title="Free plan">
          <p>Visora's Free plan doesn't require payment, so there's nothing to refund on it.</p>
        </Section>

        <Section title="Who processes your refund">
          <p>
            Payments for Visora are processed by{' '}
            <a href="https://paddle.com" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">
              Paddle.com
            </a>
            , our merchant of record. Paddle handles the actual charge and refund on our behalf — see{' '}
            <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">
              paddle.net
            </a>{' '}
            for order support, and Paddle's own Buyer Terms &amp; Conditions for anything not covered here.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about a payment or a refund request:{' '}
            <a href="mailto:visora.image@gmail.com" className="text-white underline underline-offset-2">
              visora.image@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}
