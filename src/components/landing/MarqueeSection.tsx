import { useEffect, useRef, useState } from 'react';
import TemplateMockup, { type MockupVariant } from './TemplateMockup';

const ROW_1: MockupVariant[] = ['certificate', 'quote', 'podcast', 'pricing', 'invoice', 'wedding', 'stats', 'product', 'certificate', 'quote', 'podcast'];
const ROW_2: MockupVariant[] = ['pricing', 'invoice', 'wedding', 'stats', 'product', 'certificate', 'quote', 'podcast', 'pricing', 'invoice'];

function tripled(row: MockupVariant[]) {
  return [...row, ...row, ...row];
}

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const raw = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
      setOffset(raw);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="bg-black pt-24 sm:pt-32 md:pt-40 pb-10 overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 sm:gap-3" style={{ willChange: 'transform', transform: `translateX(${offset - 200}px)` }}>
          {tripled(ROW_1).map((variant, i) => (
            <TemplateMockup key={i} variant={variant} className="w-[220px] h-[142px] sm:w-[320px] sm:h-[206px] md:w-[420px] md:h-[270px] shrink-0" />
          ))}
        </div>
        <div className="flex gap-2 sm:gap-3" style={{ willChange: 'transform', transform: `translateX(${-(offset - 200)}px)` }}>
          {tripled(ROW_2).map((variant, i) => (
            <TemplateMockup key={i} variant={variant} className="w-[220px] h-[142px] sm:w-[320px] sm:h-[206px] md:w-[420px] md:h-[270px] shrink-0" />
          ))}
        </div>
      </div>
    </section>
  );
}
