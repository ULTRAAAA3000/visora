import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TemplateMockup, { type MockupVariant } from './TemplateMockup';
import BrowserFrame from './BrowserFrame';
import FadeIn from './FadeIn';
import { GhostButton } from './Buttons';

interface ShowcaseItem {
  number: string;
  category: string;
  name: string;
  mockups: MockupVariant[];
}

const ITEMS: ShowcaseItem[] = [
  { number: '01', category: 'E-commerce', name: 'Product & Pricing Cards', mockups: ['product', 'pricing', 'invoice'] },
  { number: '02', category: 'Credentials', name: 'Certificates & Achievements', mockups: ['certificate', 'stats', 'wedding'] },
  { number: '03', category: 'Content', name: 'Social & Podcast Assets', mockups: ['quote', 'podcast', 'certificate'] },
];

function StackCard({ item, index, total }: { item: ShowcaseItem; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });

  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);
  const navigate = useNavigate();

  return (
    <div ref={ref} className="h-[85vh] sticky" style={{ top: `${96 + index * 28}px` }}>
      <motion.div
        style={{ scale, top: `${index * 28}px` }}
        className="relative rounded-[40px] sm:rounded-[50px] md:rounded-[60px] border-2 border-[#D7E2EA] bg-black p-4 sm:p-6 md:p-8 h-full"
      >
        <div className="flex items-center justify-between mb-6 md:mb-10 px-2 sm:px-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <span className="font-black text-white" style={{ fontSize: 'clamp(2.5rem, 8vw, 100px)' }}>
              {item.number}
            </span>
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-[#D7E2EA]/60 mb-1">{item.category}</p>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-medium text-white">{item.name}</h3>
            </div>
          </div>
          <GhostButton onClick={() => navigate('/signup')} className="hidden sm:block text-xs sm:text-sm">
            Use these templates
          </GhostButton>
        </div>

        <div className="flex gap-3 sm:gap-4 h-[calc(100%-100px)] px-2 sm:px-4 pb-2">
          <div className="w-2/5 flex flex-col gap-3 sm:gap-4">
            <BrowserFrame url={`visora.io/render/${item.mockups[0]}.png`} className="flex-1">
              <TemplateMockup variant={item.mockups[0]} />
            </BrowserFrame>
            <BrowserFrame url={`visora.io/render/${item.mockups[1]}.png`} className="flex-[1.5]">
              <TemplateMockup variant={item.mockups[1]} />
            </BrowserFrame>
          </div>
          <BrowserFrame url={`visora.io/render/${item.mockups[2]}.png`} className="w-3/5 h-full">
            <TemplateMockup variant={item.mockups[2]} />
          </BrowserFrame>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProjectsSection() {
  return (
    <section
      id="showcase"
      className="relative bg-black rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 z-10 px-5 sm:px-8 md:px-10 pt-20 pb-32"
    >
      <FadeIn>
        <h2
          className="font-black uppercase text-center leading-none tracking-tight bg-gradient-to-b from-[#8a8f98] to-white bg-clip-text text-transparent mb-16 sm:mb-20"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          Showcase
        </h2>
      </FadeIn>

      <div className="max-w-5xl mx-auto">
        {ITEMS.map((item, i) => (
          <StackCard key={item.number} item={item} index={i} total={ITEMS.length} />
        ))}
      </div>
    </section>
  );
}
