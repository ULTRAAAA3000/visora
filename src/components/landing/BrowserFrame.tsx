import type { ReactNode } from 'react';

/**
 * macOS-style browser chrome wrapping a template preview — the "window"
 * mockup that was missing from the landing page. Height-flexible: the
 * chrome bar is a fixed ~28px, content fills whatever's left via flex.
 */
export default function BrowserFrame({
  children,
  url = 'visor-a.com/render',
  className = '',
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] flex flex-col ${className}`}>
      <div className="flex items-center gap-3 px-3.5 py-2 bg-white/[0.04] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="flex-1 text-center text-[9px] text-white/35 truncate px-6 font-mono">{url}</span>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
