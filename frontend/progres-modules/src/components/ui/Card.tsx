import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, icon: Icon, action, subtitle, className }: { title: ReactNode; icon?: LucideIcon; action?: ReactNode; subtitle?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-4.5 w-4.5" size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-navy-900">{title}</h3>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

const statTones = {
  blue: 'bg-brand-600 shadow-brand-600/30',
  green: 'bg-emerald-500 shadow-emerald-500/30',
  purple: 'bg-violet-600 shadow-violet-600/30',
  orange: 'bg-orange-500 shadow-orange-500/30',
  red: 'bg-rose-500 shadow-rose-500/30',
  amber: 'bg-amber-500 shadow-amber-500/30',
  cyan: 'bg-cyan-500 shadow-cyan-500/30',
  slate: 'bg-slate-600 shadow-slate-600/30',
} as const;
export type StatTone = keyof typeof statTones;

export function StatCard({
  icon: Icon,
  tone = 'blue',
  label,
  value,
  trend,
  hint,
  to,
  loading,
}: {
  icon: LucideIcon;
  tone?: StatTone;
  label: string;
  value: ReactNode;
  /** percentage change, e.g. 2.5 or -1.2 */
  trend?: number;
  hint?: ReactNode;
  to?: string;
  loading?: boolean;
}) {
  const body = (
    <div className="flex h-full items-center gap-4">
      <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg', statTones[tone])}>
        <Icon className="h-7 w-7" />
      </span>
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="h-7 w-20 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="truncate text-2xl font-extrabold leading-tight text-navy-900">{value}</p>
        )}
        <p className="truncate text-sm text-slate-500">{label}</p>
        {(trend !== undefined || hint) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span className={cn('inline-flex items-center gap-0.5 font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
            )}
            {hint && <span className="truncate text-slate-400">{hint}</span>}
          </div>
        )}
      </div>
    </div>
  );
  const cls = 'block animate-slide-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition duration-200';
  return to ? (
    <Link to={to} className={cn(cls, 'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
