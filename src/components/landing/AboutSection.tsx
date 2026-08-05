import FadeIn from './FadeIn';
import AnimatedText from './AnimatedText';
import { PrimaryButton } from './Buttons';

const ABOUT_COPY =
  "Visora renders pixel-perfect OG images, product banners, certificates, and social cards from HTML and Tailwind templates — using real headless Chromium, not a language model guessing at pixels. Built for developers who need brand-accurate images at scale, in under 150 milliseconds, via one API call.";

export default function AboutSection() {
  return (
    <section id="about" className="relative min-h-screen flex items-center justify-center px-5 sm:px-8 md:px-10 py-20 bg-black overflow-hidden">
      {/* Decorative corner shapes — our own liquid-glass motif, not borrowed art */}
      <FadeIn delay={0.1} x={-80} duration={0.9} className="absolute top-[6%] left-[3%] w-32 sm:w-44 md:w-56 aspect-square rounded-full liquid-glass" />
      <FadeIn delay={0.25} x={-80} duration={0.9} className="absolute bottom-[10%] left-[8%] w-20 sm:w-28 md:w-36 aspect-square rounded-full border border-white/15" />
      <FadeIn delay={0.15} x={80} duration={0.9} className="absolute top-[6%] right-[3%] w-32 sm:w-44 md:w-56 aspect-square rounded-full liquid-glass" />
      <FadeIn delay={0.3} x={80} duration={0.9} className="absolute bottom-[10%] right-[8%] w-20 sm:w-28 md:w-36 aspect-square rounded-full border border-white/15" />

      <div className="relative flex flex-col items-center text-center gap-10 sm:gap-14 md:gap-16 max-w-3xl">
        <FadeIn delay={0} y={40}>
          <h2
            className="font-black uppercase leading-none tracking-tight bg-gradient-to-b from-[#8a8f98] to-white bg-clip-text text-transparent"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            About Visora
          </h2>
        </FadeIn>

        <AnimatedText
          text={ABOUT_COPY}
          className="text-[#D7E2EA] font-medium leading-relaxed max-w-[560px]"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
        />

        <FadeIn delay={0.2}>
          <PrimaryButton />
        </FadeIn>
      </div>
    </section>
  );
}
