"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

type Variant = "success" | "warning" | "error";

export type ToastInput = {
  message: string;
  variant?: Variant;
  href?: string;
  linkLabel?: string;
  duration?: number; // мс, по умолчанию 5000
};

type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/** Хук для показа toast-уведомлений. */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((t: ToastInput) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const VARIANT_STYLES: Record<Variant, { accent: string; icon: string; iconColor: string }> = {
  success: { accent: "border-l-green-500", icon: "✅", iconColor: "text-green-600" },
  warning: { accent: "border-l-amber-500", icon: "⚠️", iconColor: "text-amber-600" },
  error: { accent: "border-l-red-500", icon: "⛔", iconColor: "text-red-600" },
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useRef(false);

  const duration = toast.duration ?? 5000;
  const styles = VARIANT_STYLES[toast.variant ?? "success"];

  const close = useCallback(() => {
    setLeaving(true);
    const delay = reduce.current ? 0 : 250;
    setTimeout(onClose, delay);
  }, [onClose]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(close, duration);
  }, [close, duration]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    reduce.current = prefersReducedMotion();
    const raf = requestAnimationFrame(() => setShown(true));
    startTimer();
    return () => {
      cancelAnimationFrame(raf);
      clearTimer();
    };
  }, [startTimer, clearTimer]);

  const visible = shown && !leaving;

  return (
    <div
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={[
        "pointer-events-auto w-full max-w-sm rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-lg",
        styles.accent,
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 text-lg ${styles.iconColor}`} aria-hidden>
          {styles.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-slate-800">{toast.message}</p>
          {toast.href && (
            <Link
              href={toast.href}
              className="mt-1.5 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              {toast.linkLabel ?? "Открыть"} →
            </Link>
          )}
        </div>
        <button
          onClick={close}
          aria-label="Закрыть"
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
