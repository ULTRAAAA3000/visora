import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

/** Same solid white pill as the hero's primary CTA — kept as one shared component so copy/behavior stays in sync. */
export function PrimaryButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <button
      onClick={() => navigate(session ? '/dashboard' : '/signup')}
      className={`bg-white text-black rounded-full font-medium px-8 py-3 flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer ${className}`}
    >
      <span>{session ? 'Go to dashboard' : 'Get your API key'}</span>
      <ArrowRight className="w-[18px] h-[18px]" />
    </button>
  );
}

/** Liquid-glass ghost pill, matching the hero's secondary buttons. */
export function GhostButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`liquid-glass rounded-full font-medium px-8 py-3 hover:bg-white/10 transition-colors cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}
