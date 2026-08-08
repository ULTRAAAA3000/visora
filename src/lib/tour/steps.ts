export interface TourStep {
  id: string;
  /** CSS selector matching a data-tour="..." attribute somewhere in the dashboard. Omit for a centered, un-anchored step (intro/outro). */
  target?: string;
  /** Route the step's target lives on — the tour navigates here automatically before showing the step. */
  route?: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Visora',
    body: "Quick tour — about 6 steps, 30 seconds. You can skip it any time, and replay it later from the sidebar.",
  },
  {
    id: 'nav-overview',
    route: '/dashboard',
    target: '[data-tour="nav-overview"]',
    title: 'Your dashboard home',
    body: 'This is Overview — your API key and monthly usage live here. It\'s the first thing you\'ll see every time you log in.',
    placement: 'right',
  },
  {
    id: 'api-key',
    route: '/dashboard',
    target: '[data-tour="api-key"]',
    title: 'Your API key',
    body: 'Every render request needs this key in the Authorization header. Copy it now — you\'ll need it for the API, or for connecting the WordPress plugin, Telegram bot, or Make.com.',
    placement: 'bottom',
  },
  {
    id: 'usage',
    route: '/dashboard',
    target: '[data-tour="usage"]',
    title: 'Monthly usage',
    body: "Tracks renders against your plan's quota, resetting each month. Upgrade any time if you're getting close to the limit.",
    placement: 'top',
  },
  {
    id: 'nav-templates',
    route: '/dashboard',
    target: '[data-tour="nav-templates"]',
    title: 'Templates',
    body: "Let's look at where the actual designs live — click Next to head over.",
    placement: 'right',
  },
  {
    id: 'preset-gallery',
    route: '/dashboard/templates',
    target: '[data-tour="preset-gallery"]',
    title: 'Preset gallery',
    body: "30+ ready-made templates — OG images, banners, certificates, and more. Pick one, it's copied into your own templates, ready to render.",
    placement: 'top',
  },
  {
    id: 'create-blank',
    route: '/dashboard/templates',
    target: '[data-tour="create-blank"]',
    title: 'Or build your own',
    body: 'Start from a blank HTML + Tailwind template if none of the presets fit. Any {{variable}} in the markup becomes a field you fill in at render time.',
    placement: 'left',
  },
  {
    id: 'finish',
    title: "That's it",
    body: 'Full API reference is in Docs. If code isn\'t your thing, the Guide page walks through no-code options too — WordPress, Telegram, Make.com. Replay this tour any time from "Take the tour" in the sidebar.',
  },
];
