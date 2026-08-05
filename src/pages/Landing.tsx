import VisoraHero from '../components/VisoraHero';
import MarqueeSection from '../components/landing/MarqueeSection';
import AboutSection from '../components/landing/AboutSection';
import ServicesSection from '../components/landing/ServicesSection';
import ProjectsSection from '../components/landing/ProjectsSection';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="bg-black" style={{ overflowX: 'clip' }}>
      <VisoraHero />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <Footer />
    </div>
  );
}
