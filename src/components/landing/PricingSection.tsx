import { Check, Minus, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import FadeIn from './FadeIn';
import { GhostButton } from './Buttons';

/**
 * Feature-comparison pricing table. Placeholder prices/limits below —
 * swap these once LemonSqueezy plans are finalized (Phase 4). Tiers
 * mirror the real `plan_tier` values templates are gated on
 * ('free' | 'pro' | 'agency'), so this table describes the product as
 * it actually behaves today, not an aspirational SKU list.
 */

type Cell = { type: 'check' } | { type: 'dash' } | { type: 'text'; value: string };

interface FeatureRow {
  name: string;
  free: Cell;
  pro: Cell;
  agency: Cell;
}

interface FeatureGroup {
  title: string;
  rows: FeatureRow[];
}

const GROUPS: FeatureGroup[] = [
  {
    title: 'Usage',
    rows: [
      { name: 'Renders / month', free: { type: 'text', value: '500' }, pro: { type: 'text', value: '20,000' }, agency: { type: 'text', value: '100,000' } },
      { name: 'API keys', free: { type: 'text', value: '1' }, pro: { type: 'text', value: '5' }, agency: { type: 'text', value: 'Unlimited' } },
      { name: 'Concurrent renders', free: { type: 'text', value: '1' }, pro: { type: 'text', value: '5' }, agency: { type: 'text', value: '20' } },
      { name: 'Team seats', free: { type: 'text', value: '1' }, pro: { type: 'text', value: '3' }, agency: { type: 'text', value: 'Unlimited' } },
    ],
  },
  {
    title: 'Rendering & templates',
    rows: [
      { name: 'Real Chromium rendering', free: { type: 'check' }, pro: { type: 'check' }, agency: { type: 'check' } },
      { name: 'Custom HTML/Tailwind templates', free: { type: 'check' }, pro: { type: 'check' }, agency: { type: 'check' } },
      { name: 'Preset template library', free: { type: 'text', value: 'Free presets' }, pro: { type: 'text', value: 'Free + Pro' }, agency: { type: 'text', value: 'All presets' } },
      { name: 'Agency-exclusive templates', free: { type: 'dash' }, pro: { type: 'dash' }, agency: { type: 'check' } },
      { name: 'Max resolution', free: { type: 'text', value: '1200×630' }, pro: { type: 'text', value: '4K' }, agency: { type: 'text', value: '4K' } },
      { name: 'Custom font uploads', free: { type: 'dash' }, pro: { type: 'check' }, agency: { type: 'check' } },
      { name: 'Output watermark', free: { type: 'text', value: 'Visora badge' }, pro: { type: 'text', value: 'None' }, agency: { type: 'text', value: 'None' } },
      { name: 'Webhook delivery', free: { type: 'dash' }, pro: { type: 'check' }, agency: { type: 'check' } },
      { name: 'Priority render queue', free: { type: 'dash' }, pro: { type: 'dash' }, agency: { type: 'check' } },
      { name: 'Support', free: { type: 'text', value: 'Community' }, pro: { type: 'text', value: 'Email' }, agency: { type: 'text', value: 'Priority + Slack' } },
    ],
  },
];

const Cell = ({ cell }: { cell: Cell }) => {
  if (cell.type === 'check') {
    return (
      <div className="flex justify-center">
        <div className="rounded-full border border-white/25 p-1">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      </div>
    );
  }
  if (cell.type === 'dash') {
    return (
      <div className="flex justify-center">
        <Minus className="w-3.5 h-3.5 text-white/20" strokeWidth={2.5} />
      </div>
    );
  }
  return <div className="text-center text-sm text-[#D7E2EA] font-medium">{cell.value}</div>;
};

interface PlanColumn {
  key: 'free' | 'pro' | 'agency';
  name: string;
  price: string;
  cadence: string;
  cta: string;
  featured?: boolean;
}

const PLANS: PlanColumn[] = [
  { key: 'free', name: 'Free', price: '$0', cadence: 'forever', cta: 'Get your API key' },
  { key: 'pro', name: 'Pro', price: '$19', cadence: '/ month', cta: 'Start on Pro', featured: true },
  { key: 'agency', name: 'Agency', price: '$49', cadence: '/ month', cta: 'Start on Agency' },
];

export default function PricingSection() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSelect = () => navigate(session ? '/dashboard' : '/signup');

  return (
    <section id="pricing" className="relative bg-black px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 z-10">
      <FadeIn>
        <h2
          className="font-black uppercase text-center leading-none tracking-tight bg-gradient-to-b from-[#8a8f98] to-white bg-clip-text text-transparent mb-4 sm:mb-6"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          Pricing
        </h2>
      </FadeIn>
      <FadeIn delay={0.1}>
        <p className="text-center text-[#D7E2EA]/60 font-medium mb-16 sm:mb-20 max-w-lg mx-auto" style={{ fontSize: 'clamp(0.9rem, 1.6vw, 1.1rem)' }}>
          Start free, scale to a plan that matches your render volume. No surprise overages.
        </p>
      </FadeIn>

      <div className="max-w-6xl mx-auto overflow-x-auto">
        <div className="min-w-[820px]">
          {/* Plan header row */}
          <div className="grid grid-cols-[280px_1fr_1fr_1fr] gap-4 items-end mb-8 px-4">
            <div />
            {PLANS.map((plan) => (
              <FadeIn key={plan.key} delay={0.05}>
                <div
                  className={`relative flex flex-col items-center gap-4 rounded-3xl px-4 py-8 liquid-glass ${
                    plan.featured ? 'bg-white/[0.04] border border-white/20' : ''
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 text-[10px] uppercase tracking-widest bg-white text-black rounded-full px-3 py-1 font-semibold">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {plan.key === 'agency' && <Crown className="w-4 h-4 text-white/70" />}
                    <span className="text-base font-semibold text-white">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-[#D7E2EA]/50">{plan.cadence}</span>
                  </div>
                  <GhostButton onClick={handleSelect} className="w-full text-xs sm:text-sm justify-center">
                    {plan.cta}
                  </GhostButton>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Feature groups */}
          <div className="flex flex-col gap-10">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4 px-4">{group.title}</h3>
                <div className="flex flex-col rounded-2xl overflow-hidden border border-white/10">
                  {group.rows.map((row, i) => (
                    <div
                      key={row.name}
                      className={`grid grid-cols-[280px_1fr_1fr_1fr] gap-4 py-4 px-4 items-center transition-colors hover:bg-white/[0.03] ${
                        i % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'
                      }`}
                    >
                      <span className="text-sm text-[#D7E2EA]/80 font-medium pr-4">{row.name}</span>
                      <Cell cell={row.free} />
                      <Cell cell={row.pro} />
                      <Cell cell={row.agency} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
