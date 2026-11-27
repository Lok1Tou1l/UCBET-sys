import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Inbox, Lock, SearchX, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { getErrorMessage, isForbidden } from '@/services/http';
import { Button } from './Button';

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact }: { icon?: LucideIcon; title?: string; description?: ReactNode; action?: ReactNode; className?: string; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-14', className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" />
      </span>
      <h4 className="text-base font-bold text-slate-700">{title ?? t('table.empty')}</h4>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description ?? t('table.emptyHint')}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NoResults({ onReset }: { onReset?: () => void }) {
  const { t } = useI18n();
  return <EmptyState icon={SearchX} action={onReset && <Button variant="secondary" size="sm" onClick={onReset}>{t('action.reset')}</Button>} />;
}

export function AccessDenied({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-24')}>
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <Lock className="h-8 w-8" />
      </span>
      <h2 className="text-xl font-bold text-navy-900">{t('state.forbidden')}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">{t('state.forbiddenHint')}</p>
      <Link to="/" className="mt-5 text-sm font-semibold text-brand-600 hover:underline">
        {t('state.backHome')}
      </Link>
    </div>
  );
}

/** Generic error block; shows the permission-denied state automatically for HTTP 403. */
export function ErrorState({ error, onRetry, compact }: { error?: unknown; onRetry?: () => void; compact?: boolean }) {
  const { t } = useI18n();
  if (isForbidden(error)) return <AccessDenied compact={compact} />;
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16')}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle className="h-7 w-7" />
      </span>
      <h4 className="text-base font-bold text-slate-700">{t('state.error')}</h4>
      <p className="mt-1 max-w-md text-sm text-slate-500">{error ? getErrorMessage(error) : t('state.errorHint')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {t('action.retry')}
        </Button>
      )}
    </div>
  );
}

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h2 className="mt-3 text-xl font-bold text-navy-900">{t('state.notFound')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('state.notFoundHint')}</p>
      <Link to="/" className="mt-5 text-sm font-semibold text-brand-600 hover:underline">
        {t('state.backHome')}
      </Link>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-slate-100', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent rtl:translate-x-full" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600', className)} role="status" aria-label="loading" />;
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

/** Skeleton placeholder for a whole page (header + cards + block). */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
