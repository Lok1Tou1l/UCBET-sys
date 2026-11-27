import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { SortState } from '@/types/common';
import { ErrorState, EmptyState, Skeleton } from './States';
import { controlCls } from './Fields';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  /** key sent to the API for sorting (defaults to `key`) */
  sortKey?: string;
  align?: 'start' | 'center' | 'end';
  /** applied to both th and td – use e.g. 'hidden lg:table-cell' for responsive columns */
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  sort?: SortState;
  onSortChange?: (s: SortState | undefined) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (p: number) => void;
  onPageSizeChange?: (n: number) => void;
  pageSizeOptions?: number[];
  minWidth?: number;
  className?: string;
}

const alignCls = { start: 'text-start', center: 'text-center', end: 'text-end' };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  sort,
  onSortChange,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
  page,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  minWidth = 760,
  className,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const toggleSort = (c: Column<T>) => {
    if (!c.sortable || !onSortChange) return;
    const key = c.sortKey ?? c.key;
    if (!sort || sort.key !== key) onSortChange({ key, dir: 'asc' });
    else if (sort.dir === 'asc') onSortChange({ key, dir: 'desc' });
    else onSortChange(undefined);
  };

  const showSkeleton = loading && !rows?.length;
  const showEmpty = !loading && !error && rows && rows.length === 0;

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card', className)}>
      {error && !rows?.length ? (
        <ErrorState error={error} onRetry={onRetry} compact />
      ) : (
        <div className={cn('overflow-x-auto transition-opacity', loading && rows?.length ? 'opacity-60' : 'opacity-100')}>
          <table className="w-full border-collapse text-sm" style={{ minWidth }}>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {columns.map((c) => {
                  const key = c.sortKey ?? c.key;
                  const active = sort?.key === key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={cn('whitespace-nowrap px-4 py-3 text-[13.5px] font-semibold text-navy-900', alignCls[c.align ?? 'start'], c.className)}
                    >
                      {c.sortable ? (
                        <button onClick={() => toggleSort(c)} className={cn('group inline-flex items-center gap-1 rounded transition hover:text-brand-700', active && 'text-brand-700')} title={active ? (sort!.dir === 'asc' ? t('table.sortDesc') : t('table.sortAsc')) : t('table.sortAsc')}>
                          {c.header}
                          {active ? sort!.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showSkeleton &&
                Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-4', c.className)}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))}
              {rows?.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/40 focus:bg-brand-50/60 focus:outline-none')}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3 align-middle text-slate-700', alignCls[c.align ?? 'start'], c.className)}>
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showEmpty && <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />}
      {total !== undefined && page !== undefined && onPageChange && total > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (n: number) => void;
  pageSizeOptions?: number[];
}) {
  const { t, formatNumber } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const list: (number | '…')[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) list.push(p);
    else if (list[list.length - 1] !== '…') list.push('…');
  }

  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition disabled:opacity-40';
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{t('table.showing', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total) })}</span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">{t('table.rowsPerPage')}</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className={cn(controlCls, 'h-8 w-auto py-0 pe-7 text-xs')}>
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="pagination">
        <button className={cn(btn, 'text-slate-600 hover:bg-white hover:shadow-sm')} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t('action.previous')}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        {list.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)} aria-current={p === page ? 'page' : undefined} className={cn(btn, p === page ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'text-slate-600 hover:bg-white hover:shadow-sm')}>
              {formatNumber(p)}
            </button>
          ),
        )}
        <button className={cn(btn, 'text-slate-600 hover:bg-white hover:shadow-sm')} disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label={t('action.next')}>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </nav>
    </div>
  );
}
