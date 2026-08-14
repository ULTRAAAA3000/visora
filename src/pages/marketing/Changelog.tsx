import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import { usePageMeta } from '../../lib/usePageMeta';

interface Entry {
  date: string;
  title: string;
  items: string[];
}

const ENTRIES: Entry[] = [
  {
    date: 'August 2026',
    title: 'Agency tier & gallery growth',
    items: [
      'Grew the preset gallery to 30 templates',
      'Added an Agency-exclusive tier — 5 top-shelf templates gated separately from Pro',
      'Design pass on the flattest presets (Newsletter Header, Resume Header, App Promo Banner, Job Opening Card)',
      'Browser-window mockups on the landing page marquee and showcase',
    ],
  },
  {
    date: 'August 2026',
    title: 'Dashboard & template editor',
    items: [
      'Email/password auth with automatic API key generation on first login',
      'Dashboard: API key management, usage quota, template editor with live preview',
      'Fill-in-the-blanks field editor — no JSON required to customize a template',
      'Full TypeScript migration across frontend and render Worker',
    ],
  },
  {
    date: 'August 2026',
    title: 'Render engine',
    items: [
      'Cloudflare Worker render API using Browser Rendering (real headless Chromium)',
      'R2-backed image storage',
      'Supabase schema: profiles, templates, render logs, row-level security',
    ],
  },
  {
    date: 'August 2026',
    title: 'Launch',
    items: ['Landing page, hero, and the first version of Visora went live on Cloudflare Pages'],
  },
];

export default function Changelog() {
  usePageMeta({
    title: 'Changelog',
    description: "What's shipped in Visora, in order — new templates, API features, integrations, and fixes.",
    path: '/changelog',
  });

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Changelog</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-16">What's new in Visora</h1>

        <div className="space-y-16">
          {ENTRIES.map((entry, i) => (
            <div key={i} className="relative pl-8 border-l border-white/10">
              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white" />
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">{entry.date}</p>
              <h2 className="text-2xl font-semibold text-white mb-4">{entry.title}</h2>
              <ul className="space-y-2">
                {entry.items.map((item, j) => (
                  <li key={j} className="text-[#D7E2EA]/70 flex items-start gap-2.5">
                    <span className="text-white/30 mt-1.5">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
