import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VisoraHero from '../components/VisoraHero';
import MarqueeSection from '../components/landing/MarqueeSection';
import AboutSection from '../components/landing/AboutSection';
import ServicesSection from '../components/landing/ServicesSection';
import ProjectsSection from '../components/landing/ProjectsSection';
import PricingSection from '../components/landing/PricingSection';
import Footer from '../components/landing/Footer';

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // Sections mount async-ish (images, fonts) — wait a tick before measuring.
    const timeout = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timeout);
  }, [location.hash]);

  return (
    <div className="bg-black" style={{ overflowX: 'clip' }}>
      <VisoraHero />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
