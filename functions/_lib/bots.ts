// Known crawler/bot user-agent substrings. Matching one of these serves a
// static, server-rendered HTML snapshot instead of the SPA shell — this is
// "dynamic rendering", the same technique Google has recommended for years
// for JS-heavy sites, extended here to AI answer-engine crawlers too. Real
// visitors (anything not matching this list) always get the normal
// interactive React app; nothing about their experience changes.
export const BOT_USER_AGENTS = [
  // AI crawlers / answer engines
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'claudebot',
  'claude-user',
  'claude-searchbot',
  'anthropic-ai',
  'perplexitybot',
  'perplexity-user',
  'google-extended',
  'googleother',
  'ccbot',
  'bytespider',
  'applebot-extended',
  'amazonbot',
  'cohere-ai',
  'meta-externalagent',
  'diffbot',
  // Traditional search engine crawlers
  'googlebot',
  'bingbot',
  'duckduckbot',
  'yandexbot',
  'baiduspider',
  // Social/link-preview crawlers (benefit from OG tags being real HTML too)
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
];

export function isBotRequest(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}
