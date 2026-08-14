import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import { usePageMeta } from '../../lib/usePageMeta';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-semibold text-white mb-5">{title}</h2>
      <div className="space-y-4 text-[#D7E2EA]/80 leading-relaxed">{children}</div>
    </section>
  );
}

export default function About() {
  usePageMeta({
    title: 'About',
    description:
      'Why Visora exists, how it actually renders images, and who builds it — a small, API-first tool for developers who need brand-accurate images at scale.',
    path: '/about',
  });

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">About</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">Images your brand never gets wrong.</h1>

        <Section title="Why Visora exists">
          <p>
            Most "generate an image" tools today are a diffusion model guessing at pixels — close enough for a
            mood board, not close enough for a logo that has to land in the exact same spot on every single
            render. Brand assets, product banners, certificates — anything with a fixed layout — need to be
            <em className="not-italic text-white"> exact</em>, not approximately right.
          </p>
          <p>
            Visora exists to be the boring, reliable version of that: give it a template and some data, get back
            the same pixel-perfect image every time, because it isn't generating anything — it's rendering real
            HTML and Tailwind CSS in a real browser and taking a screenshot.
          </p>
        </Section>

        <Section title="How it actually works">
          <p>
            Under the hood, every render spins up a real headless Chromium instance (via Cloudflare's Browser
            Rendering), loads your template with the data filled in, and screenshots it. That means anything
            CSS can do — gradients, custom fonts, flexbox and grid layouts, Tailwind utility classes — renders
            exactly as it would in a browser, because it is a browser. No model in the loop, nothing to
            hallucinate.
          </p>
          <p>
            Identical requests are served from cache instead of re-rendering, so the same template with the
            same data comes back in milliseconds on repeat calls — and the image URL stays stable until you
            actually change the template.
          </p>
        </Section>

        <Section title="Who's behind it">
          <p>
            Visora is built and operated out of Ukraine as a small, independent, API-first product — not a
            venture-backed platform with a growth team. That means changes ship fast and support replies come
            from someone who actually built the thing, but also that Visora is one focused product rather than
            a suite trying to do everything.
          </p>
        </Section>

        <Section title="Get in touch">
          <p>
            Questions, bug reports, feature requests, or partnership inquiries —{' '}
            <a href="/contact" className="text-white underline underline-offset-2">
              reach out directly
            </a>
            . Or take a look at the{' '}
            <a href="/docs" className="text-white underline underline-offset-2">
              API docs
            </a>{' '}
            and{' '}
            <a href="/templates" className="text-white underline underline-offset-2">
              template gallery
            </a>{' '}
            to see what it can do.
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}
