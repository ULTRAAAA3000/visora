/**
 * Hand-written search index rather than crawling rendered DOM or
 * running a build-time content extractor — the docs are small and
 * stable enough (a handful of pages) that maintaining this list by
 * hand is simpler than the tooling a "real" search index would need,
 * and it lets each entry link straight to the right in-page anchor.
 *
 * Keep this in sync with Docs.tsx's <Section id=...> list and
 * GuideBody.tsx's <Section> list when either changes.
 */
export interface SearchEntry {
  title: string;
  description: string;
  url: string;
  category: 'Docs' | 'Guide' | 'Site';
}

export const SEARCH_INDEX: SearchEntry[] = [
  // Docs (API reference)
  {
    title: 'Authentication',
    description: 'How to pass your API key as a Bearer token.',
    url: '/docs#authentication',
    category: 'Docs',
  },
  {
    title: 'Render endpoint',
    description: 'POST /api/v1/render — the one endpoint that does everything.',
    url: '/docs#endpoint',
    category: 'Docs',
  },
  {
    title: 'Request body',
    description: 'template_id, format, and data — what to send.',
    url: '/docs#request',
    category: 'Docs',
  },
  {
    title: 'Response',
    description: 'What comes back: image URL, dimensions, render time, cache status.',
    url: '/docs#response',
    category: 'Docs',
  },
  {
    title: 'Errors',
    description: '400, 401, 404, 429, 500 — what each status code means.',
    url: '/docs#errors',
    category: 'Docs',
  },
  {
    title: 'Rate limits & quota',
    description: 'Monthly render quota, what happens when you hit it.',
    url: '/docs#rate-limits',
    category: 'Docs',
  },
  {
    title: 'Webhooks',
    description: 'Get notified when a render finishes instead of polling. Pro/Agency.',
    url: '/docs#webhooks',
    category: 'Docs',
  },
  {
    title: 'Integrations',
    description: 'Make.com, WordPress, Telegram, and the browser extension.',
    url: '/docs#integrations',
    category: 'Docs',
  },

  // Guide (plain-language walkthrough)
  {
    title: 'What Visora actually does',
    description: 'The short version, for anyone who has never used an API.',
    url: '/guide#what-it-does',
    category: 'Guide',
  },
  {
    title: 'Three ways to use Visora',
    description: 'By hand, no-code automation, or a real API call — pick what fits.',
    url: '/guide#three-ways',
    category: 'Guide',
  },
  {
    title: 'Getting started',
    description: 'Create an account, find your API key, pick a template.',
    url: '/guide#getting-started',
    category: 'Guide',
  },
  {
    title: "Don't want to write code?",
    description: 'WordPress plugin, Make.com, Telegram bot, browser extension.',
    url: '/guide#no-code',
    category: 'Guide',
  },
  {
    title: 'For developers: the actual API call',
    description: 'A copy-pasteable curl example.',
    url: '/guide#for-developers',
    category: 'Guide',
  },
  {
    title: 'Common questions',
    description: "Variables not showing up, custom HTML, leaked API keys.",
    url: '/guide#faq',
    category: 'Guide',
  },

  // Rest of the site
  { title: 'Templates gallery', description: '30+ ready-made presets, free/Pro/Agency.', url: '/templates', category: 'Site' },
  { title: 'Pricing', description: 'Free, Pro, and Agency plans compared.', url: '/#pricing', category: 'Site' },
  { title: 'Changelog', description: "What's shipped, in order.", url: '/changelog', category: 'Site' },
  { title: 'Contact', description: 'Reach us directly — bugs, questions, partnerships.', url: '/contact', category: 'Site' },
  { title: 'Refund Policy', description: '14-day money-back guarantee, no questions asked.', url: '/refund', category: 'Site' },
  { title: 'Privacy Policy', description: 'What data Visora collects and how it\'s used.', url: '/privacy', category: 'Site' },
  { title: 'Terms of Service', description: "The terms covering your use of Visora.", url: '/terms', category: 'Site' },
  { title: 'Dashboard', description: 'Your API key, templates, usage, billing, webhooks.', url: '/dashboard', category: 'Site' },
];

export function searchDocs(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return SEARCH_INDEX.map((entry) => {
    const haystack = `${entry.title} ${entry.description}`.toLowerCase();
    let score = 0;
    if (entry.title.toLowerCase().startsWith(q)) score += 3;
    else if (entry.title.toLowerCase().includes(q)) score += 2;
    else if (haystack.includes(q)) score += 1;
    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}
