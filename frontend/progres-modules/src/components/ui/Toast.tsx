import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const styles: Record<ToastKind, { icon: typeof Info; cls: string; iconCls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-emerald-200', iconCls: 'text-emerald-600' },
  error: { icon: XCircle, cls: 'border-rose-200', iconCls: 'text-rose-600' },
  info: { icon: Info, cls: 'border-sky-200', iconCls: 'text-sky-600' },
  warning: { icon: AlertTriangle, cls: 'border-amber-200', iconCls: 'text-amber-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const { t } = useI18n();

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l.slice(-3), { id, kind, title, description }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6500 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (a, b) => push('success', a, b),
      error: (a, b) => push('error', a, b),
      info: (a, b) => push('info', a, b),
      warning: (a, b) => push('warning', a, b),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {items.map((it) => {
          const s = styles[it.kind];
          const Icon = s.icon;
          return (
            <div key={it.id} role="status" className={cn('pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border bg-white p-3.5 shadow-pop', s.cls)}>
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', s.iconCls)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{it.title}</p>
                {it.description && <p className="mt-0.5 text-sm text-slate-500">{it.description}</p>}
              </div>
              <button onClick={() => dismiss(it.id)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label={t('action.close')}>
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
