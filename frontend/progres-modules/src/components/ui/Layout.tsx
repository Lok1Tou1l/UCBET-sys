import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter, RotateCcw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Button } from './Button';

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({ title, subtitle, actions, breadcrumbs, badge }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; breadcrumbs?: Crumb[]; badge?: ReactNode }) {
  return (
    <div className="mb-6 animate-fade-in">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {c.to ? (
                <Link to={c.to} className="font-medium hover:text-brand-600">
                  {c.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-700">{c.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 rtl:rotate-180" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 rtl:tracking-normal sm:text-3xl">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Responsive filter toolbar: put SearchInput + FilterSelect/DateInput children inside. */
export function FilterBar({ children, onReset, activeCount = 0, className }: { children: ReactNode; onReset?: () => void; activeCount?: number; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn('mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card', className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="hidden items-center gap-1.5 pe-1 text-xs font-bold uppercase tracking-wide text-slate-400 rtl:tracking-normal lg:flex">
          <Filter className="h-3.5 w-3.5" />
          {t('action.filters')}
        </span>
        {children}
        {onReset && activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="h-3.5 w-3.5" />}>
            {t('action.reset')} ({activeCount})
          </Button>
        )}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, active, onChange, className }: { tabs: { id: T; label: ReactNode; icon?: LucideIcon; count?: number }[]; active: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-slate-200', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:bg-slate-50',
              isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>{tab.count}</span>}
            <span className={cn('absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600 transition-transform duration-200', isActive ? 'scale-x-100' : 'scale-x-0')} />
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, className, showLabel = true, tone }: { value: number; className?: string; showLabel?: boolean; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  const v = Math.max(0, Math.min(100, value));
  const color = tone ?? (v >= 100 ? 'green' : 'blue');
  const bar = { blue: 'bg-brand-600', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' }[color];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-2 min-w-[60px] flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-all duration-700', bar)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-9 text-end text-xs font-bold tabular-nums text-slate-700">{Math.round(v)}%</span>}
    </div>
  );
}

export function DescriptionList({ items, columns = 2, className }: { items: { label: ReactNode; value: ReactNode; full?: boolean }[]; columns?: 1 | 2 | 3; className?: string }) {
  const { t } = useI18n();
  const grid = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }[columns];
  return (
    <dl className={cn('grid gap-x-8 gap-y-4', grid, className)}>
      {items.map((it, i) => (
        <div key={i} className={cn('min-w-0', it.full && 'sm:col-span-full')}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400 rtl:tracking-normal">{it.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">{it.value === undefined || it.value === null || it.value === '' ? <span className="text-slate-400">{t('common.notProvided')}</span> : it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const avatarColors = ['bg-brand-100 text-brand-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'];
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  const s = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm', xl: 'h-20 w-20 text-2xl' }[size];
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', s, avatarColors[hash % avatarColors.length], className)}>{ini}</span>;
}

export interface TimelineItem {
  id: string;
  title: ReactNode;
  time?: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  icon?: LucideIcon;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple';
}
const dotTone = { blue: 'bg-brand-100 text-brand-600', green: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', red: 'bg-rose-100 text-rose-600', slate: 'bg-slate-100 text-slate-500', purple: 'bg-violet-100 text-violet-600' };

/** Vertical timeline (RTL-safe, uses logical borders). */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <li key={it.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < items.length - 1 && <span className="absolute start-[15px] top-8 h-[calc(100%-2rem)] w-px bg-slate-200" aria-hidden />}
            <span className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white', dotTone[it.tone ?? 'blue'])}>{Icon ? <Icon className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <p className="text-sm font-bold text-slate-800">{it.title}</p>
                {it.time && <span className="text-xs text-slate-400">{it.time}</span>}
              </div>
              {it.meta && <div className="mt-0.5 text-xs text-slate-500">{it.meta}</div>}
              {it.body && <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{it.body}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
