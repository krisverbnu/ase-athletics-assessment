// Small pop-up messages ("Player saved") that disappear after a few seconds
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((all) => [...all, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* aria-live: screen readers announce new messages */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex print:hidden w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 rounded-lg border border-secondary-200 bg-white p-4 shadow-lg motion-safe:animate-toast-in"
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
            )}
            <p className="flex-1 text-sm text-secondary-800">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-secondary-400 hover:text-secondary-700"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
