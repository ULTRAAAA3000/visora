import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { searchDocs, type SearchEntry } from '../lib/searchIndex';

const CATEGORY_COLOR: Record<SearchEntry['category'], string> = {
  Docs: 'text-sky-300/70',
  Guide: 'text-emerald-300/70',
  Site: 'text-white/40',
};

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = searchDocs(query).slice(0, 8);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Wait for the mount/animation to start before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = (entry: SearchEntry) => {
    onClose();
    navigate(entry.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[71] w-[92vw] max-w-lg"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden" onKeyDown={handleKeyDown}>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
                <Search className="w-4 h-4 text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search docs, guide, pages…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button onClick={onClose} className="shrink-0 text-white/30 hover:text-white transition-colors" aria-label="Close search">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {query.trim() && (
                <div className="max-h-[50vh] overflow-y-auto py-2">
                  {results.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-white/30">No results for "{query}"</p>
                  ) : (
                    results.map((entry, i) => (
                      <button
                        key={entry.url}
                        onClick={() => go(entry)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`w-full text-left px-4 py-2.5 flex items-start justify-between gap-3 transition-colors ${
                          i === activeIndex ? 'bg-white/[0.06]' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{entry.title}</p>
                          <p className="text-xs text-white/40 truncate">{entry.description}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] uppercase tracking-wide mt-0.5 ${CATEGORY_COLOR[entry.category]}`}>
                          {entry.category}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/10 text-[11px] text-white/30">
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> to select
                </span>
                <span>↑↓ to navigate</span>
                <span>esc to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
