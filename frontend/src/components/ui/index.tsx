"use client";

import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertTriangle, Inbox, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { errorMessage } from "@/lib/utils/errors";
import { useI18n } from "@/providers/i18n-provider";

export const cx = cn;

export function Spinner({ className }: { className?: string }) {
  return <Loader2 role="status" aria-label="loading" className={cn("h-5 w-5 animate-spin text-brand-600", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ---- Button (variants/sizes follow progres-modules/components/ui/Button.tsx)
type Variant = "primary" | "secondary" | "danger" | "ghost" | "soft" | "success";
const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 focus-visible:ring-brand-500",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500",
  danger: "bg-rose-600 text-white shadow-sm shadow-rose-600/25 hover:bg-rose-700 focus-visible:ring-rose-500",
  success: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 focus-visible:ring-emerald-500",
};
const sizes = { sm: "h-8 gap-1.5 px-3 text-xs", md: "h-10 gap-2 px-4 text-sm", lg: "h-11 gap-2 px-5 text-sm" };

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; loading?: boolean; icon?: ReactNode }>(
  function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex select-none items-center justify-center rounded-lg font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...rest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  },
);

// ---- Fields (control look follows progres-modules/components/ui/Fields.tsx)
const control =
  "block w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ms-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : (
        hint && <span className="block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={cn(control, "file:me-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand-700", className)} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} {...rest} className={cn(control, className)} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} {...rest} className={cn(control, "h-auto py-2", className)} />;
});

// ---- Layout atoms
export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card", className)}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-bold text-navy-900">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">{children}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ message, hint, action }: { message: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-rose-700">{errorMessage(error, t)}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t("action.retry")}
        </Button>
      )}
    </div>
  );
}

// ---- Badge: accepts the team's Tone names plus the short aliases used in this module
export type Tone = "slate" | "blue" | "green" | "amber" | "red" | "purple" | "orange" | "cyan" | "pink";
type BadgeTone = Tone | "neutral" | "primary" | "success" | "warning" | "danger";
const ALIAS: Record<string, Tone> = { neutral: "slate", primary: "blue", success: "green", warning: "amber", danger: "red" };
const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-500/15",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  purple: "bg-violet-50 text-violet-700 ring-violet-600/15",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/15",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
  pink: "bg-pink-50 text-pink-700 ring-pink-600/15",
};

export function Badge({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) {
  const resolved: Tone = (ALIAS[tone] ?? tone) as Tone;
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[resolved])}>{children}</span>;
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-navy-950/60" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg animate-scale-in overflow-auto rounded-2xl bg-white p-6 shadow-pop">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-navy-900">{title}</h3>
          <button onClick={onClose} aria-label={t("action.close")} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
