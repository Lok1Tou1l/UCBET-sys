import type { Paginated } from '@/types/common';

export interface ListQueryOptions<T> {
  /** fields searched by `q` (case/diacritics-insensitive) */
  searchFields?: ((row: T) => string | undefined | null)[];
  /** exact-match filters: queryKey -> accessor */
  filters?: Record<string, (row: T) => string | number | boolean | undefined | null>;
  /** sortable keys -> accessor */
  sorters?: Record<string, (row: T) => string | number | undefined | null>;
  /** date range filters, e.g. { from: 'dateFrom', to: 'dateTo', accessor } */
  dateRange?: { from: string; to: string; accessor: (row: T) => string | undefined };
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
}

export const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Generic search + filter + sort + paginate used by every mock list endpoint. */
export function listQuery<T>(rows: T[], query: Record<string, any>, opts: ListQueryOptions<T> = {}): Paginated<T> {
  let out = rows;
  const q = norm(query.q).trim();
  if (q && opts.searchFields) {
    out = out.filter((r) => opts.searchFields!.some((f) => norm(f(r)).includes(q)));
  }
  for (const [key, acc] of Object.entries(opts.filters ?? {})) {
    const v = query[key];
    if (v !== undefined && v !== '' && v !== 'all') out = out.filter((r) => String(acc(r)) === String(v));
  }
  if (opts.dateRange) {
    const { from, to, accessor } = opts.dateRange;
    if (query[from]) out = out.filter((r) => (accessor(r) ?? '') >= query[from]);
    if (query[to]) out = out.filter((r) => (accessor(r) ?? '').slice(0, 10) <= query[to]);
  }
  const sortKey = query.sort ?? opts.defaultSort?.key;
  const dir = (query.dir ?? opts.defaultSort?.dir ?? 'asc') === 'desc' ? -1 : 1;
  const sorter = sortKey ? opts.sorters?.[sortKey] : undefined;
  if (sorter) {
    out = [...out].sort((a, b) => {
      const x = sorter(a) ?? '';
      const y = sorter(b) ?? '';
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), 'fr', { numeric: true, sensitivity: 'base' }) * dir;
    });
  }
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.max(1, Number(query.pageSize) || 10);
  return { items: out.slice((page - 1) * pageSize, page * pageSize), total: out.length, page, pageSize };
}
