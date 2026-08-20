import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ImageIcon, AlertCircle } from 'lucide-react';
import { playReadyChime } from '../lib/chime';

type ToastVariant = 'success' | 'render-ready' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastOptions {
  /** Plays the notification chime. Off by default for routine success
   * toasts — reserved for things worth pulling the user's attention
   * back to the tab for (see useRenderCompletionToast). */
  sound?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  'render-ready': ImageIcon,
  error: AlertCircle,
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  'render-ready': 'text-white',
  error: 'text-red-400',
};

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success', options?: ToastOptions) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);

      if (options?.sound) playReadyChime();

      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                onClick={() => dismiss(toast.id)}
                className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur px-4 py-3 shadow-2xl shadow-black/40 cursor-pointer max-w-sm"
              >
                <motion.span
                  initial={{ scale: 0.5, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}
                  className={`shrink-0 ${ICON_COLORS[toast.variant]}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.span>
                <p className="text-sm text-white font-medium">{toast.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
