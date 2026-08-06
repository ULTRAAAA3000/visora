/**
 * Small, static recreations of a few of our actual preset templates
 * (see supabase/migrations/0006_template_design_upgrade.sql) — not photos,
 * not stock images. These are literally what Visora renders, scaled down
 * to marquee-tile size, so the marketing page shows the real product
 * instead of borrowed imagery.
 */

export type MockupVariant =
  | 'certificate'
  | 'quote'
  | 'podcast'
  | 'pricing'
  | 'invoice'
  | 'wedding'
  | 'stats'
  | 'product';

function Certificate() {
  return (
    <div className="w-full h-full bg-[#FBF7EF] flex flex-col items-center justify-center text-center p-6 relative">
      <div className="absolute inset-3 border border-[#C9A24B]" />
      <p className="text-[8px] tracking-[0.3em] uppercase text-[#C9A24B] mb-2">Certificate</p>
      <p className="font-serif italic text-lg text-[#16342B]">Jane Doe</p>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#8a6b2c] mt-3" />
    </div>
  );
}

function Quote() {
  return (
    <div className="w-full h-full bg-[#F3EEE4] relative overflow-hidden">
      <div className="absolute inset-0 bg-[#16233F]" style={{ clipPath: 'polygon(0 38%, 100% 0%, 100% 100%, 0% 100%)' }} />
      <span className="absolute top-3 left-4 font-serif text-4xl text-[#FF6B4A]">&#8220;</span>
      <p className="absolute bottom-6 left-6 right-6 text-white text-sm font-semibold leading-snug">
        Great products ship fast.
      </p>
    </div>
  );
}

function Podcast() {
  return (
    <div className="w-full h-full bg-[#121212] p-5 flex flex-col justify-between relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 80% -10%, rgba(255,90,95,0.28), transparent 60%)' }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-white/80 text-[9px] font-bold uppercase tracking-widest">Build in Public</span>
        <span className="flex items-center justify-center w-7 h-7 rounded-full border border-[#FF5A5F] text-[#FF5A5F] text-[8px] font-black shrink-0">
          42
        </span>
      </div>

      <p className="relative text-white text-sm font-black leading-tight">Shipping a micro-SaaS in a weekend</p>

      <div className="relative flex items-end gap-[3px] h-10">
        {[35, 70, 45, 90, 55, 30, 80, 50, 60, 40].map((h, i) => (
          <div key={i} className={`w-[4px] rounded-full ${i % 3 === 0 ? 'bg-white/80' : 'bg-[#FF5A5F]'}`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function Pricing() {
  return (
    <div className="w-full h-full bg-[#0E0B2E] p-5 flex flex-col justify-between relative overflow-hidden">
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 70%)' }}
      />
      <span className="bg-[#8B5CF6] text-white text-[8px] font-bold uppercase px-2 py-1 rounded-full w-fit">Pro</span>
      <p className="text-3xl font-black text-white">$49</p>
    </div>
  );
}

function Invoice() {
  return (
    <div className="w-full h-full bg-[#F7F3EC] relative overflow-hidden flex items-center">
      <div className="absolute inset-0 bg-[#16233F]" style={{ clipPath: 'polygon(0 0, 55% 0, 40% 100%, 0 100%)' }} />
      <p className="relative text-white text-xs font-bold pl-4">Visora Inc.</p>
      <p className="absolute right-4 text-xl font-black text-[#16233F]">$1,240</p>
    </div>
  );
}

function Wedding() {
  return (
    <div className="w-full h-full bg-[#FBF6EF] flex flex-col items-center justify-center text-center">
      <div className="w-8 h-8 rounded-full border border-[#B8965A] flex items-center justify-center mb-2">
        <span className="font-serif text-[10px] text-[#B8965A]">E&amp;J</span>
      </div>
      <p className="font-serif text-lg text-[#3a3a3a]">Save the Date</p>
    </div>
  );
}

function Stats() {
  return (
    <div className="w-full h-full bg-[#101014] p-5 flex flex-col justify-center gap-3">
      <div>
        <div className="h-1 rounded-full bg-[#2DD4BF] mb-1" style={{ width: '70%' }} />
        <p className="text-2xl font-black text-white leading-none">1.2M</p>
      </div>
      <div>
        <div className="h-1 rounded-full bg-[#FF6B5B] mb-1" style={{ width: '45%' }} />
        <p className="text-2xl font-black text-white leading-none">89ms</p>
      </div>
    </div>
  );
}

function Product() {
  return (
    <div className="w-full h-full bg-[#FFF6EA] p-5 flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl bg-[#1B1B1B]/10 shrink-0" />
      <div>
        <p className="text-[9px] uppercase tracking-widest text-[#FF5A36] font-bold mb-1">New</p>
        <p className="text-lg font-black text-[#1B1B1B]">$3,499</p>
      </div>
    </div>
  );
}

const VARIANTS: Record<MockupVariant, React.FC> = {
  certificate: Certificate,
  quote: Quote,
  podcast: Podcast,
  pricing: Pricing,
  invoice: Invoice,
  wedding: Wedding,
  stats: Stats,
  product: Product,
};

export default function TemplateMockup({ variant, className = '' }: { variant: MockupVariant; className?: string }) {
  const Component = VARIANTS[variant];
  return (
    <div className={`h-full w-full ${className}`}>
      <Component />
    </div>
  );
}
