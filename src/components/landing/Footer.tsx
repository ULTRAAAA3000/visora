import { Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrimaryButton } from './Buttons';

const PRODUCT_LINKS = [
  { label: 'OG Images', href: '#services' },
  { label: 'Product Banners', href: '#services' },
  { label: 'Certificates & Badges', href: '#services' },
  { label: 'Templates gallery', href: '/signup' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Showcase', href: '#showcase' },
];

export default function Footer() {
  const isHash = (href: string) => href.startsWith('#');

  const renderLink = (href: string, label: string) => {
    if (isHash(href)) {
      return (
        <a href={href} className="text-[#D7E2EA]/70 hover:text-white transition-colors text-sm">
          {label}
        </a>
      );
    }
    return (
      <Link to={href} className="text-[#D7E2EA]/70 hover:text-white transition-colors text-sm">
        {label}
      </Link>
    );
  };

  return (
    <footer className="relative bg-black border-t border-white/10 px-5 sm:px-8 md:px-10 pt-20 pb-10">
      {/* Closing CTA */}
      <div className="max-w-3xl mx-auto text-center mb-20 sm:mb-24">
        <h2
          className="font-black uppercase leading-none tracking-tight bg-gradient-to-b from-[#8a8f98] to-white bg-clip-text text-transparent mb-8"
          style={{ fontSize: 'clamp(2rem, 7vw, 96px)' }}
        >
          Stop guessing pixels.
        </h2>
        <PrimaryButton className="mx-auto" />
      </div>

      {/* Link columns */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6 pb-16 border-b border-white/10">
        <div className="col-span-2 sm:col-span-1">
          <img src="/visora-logo.png" alt="Visora" className="h-6 mb-4" />
          <p className="text-[#D7E2EA]/50 text-sm max-w-[220px]">
            Pixel-perfect image rendering for developers — real Chromium, one API call.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Product</p>
          <ul className="space-y-3">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>{renderLink(link.href, link.label)}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Company</p>
          <ul className="space-y-3">
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>{renderLink(link.href, link.label)}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Developers</p>
          <ul className="space-y-3">
            <li>
              <Link to="/signup" className="text-[#D7E2EA]/70 hover:text-white transition-colors text-sm">
                Get an API key
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/ULTRAAAA3000/visora"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#D7E2EA]/70 hover:text-white transition-colors text-sm"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
        <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} Visora. All rights reserved.</p>
        <a
          href="https://github.com/ULTRAAAA3000/visora"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 rounded-full liquid-glass hover:bg-white/10 transition-colors"
          aria-label="Visora on GitHub"
        >
          <Github className="w-4 h-4 text-white/70" />
        </a>
      </div>
    </footer>
  );
}
