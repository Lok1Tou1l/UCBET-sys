import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ListParams, SortState } from '@/types/common';
import { cleanParams } from '@/lib/utils';

export function useDebounce<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

interface Options {
  pageSize?: number;
  sort?: SortState;
}

/**
 * State for a filterable / sortable / paginated list.
 *
 *   const list = useListQuery({ status: '', year: '' }, { sort: { key: 'submittedAt', dir: 'desc' } });
 *   const { data, loading, error } = useAsync(() => service.list(list.params), [list.paramsKey]);
 *   <SearchInput value={list.search} onChange={list.setSearch} />
 *   <DataTable sort={list.sort} onSortChange={list.setSort} page={list.page} ... />
 *
 * `list.params` is the debounced, cleaned query ready for the API; any filter / search / sort
 * change resets the page to 1.
 */
export function useListQuery<F extends Record<string, string>>(initialFilters: F, options: Options = {}) {
  const [filters, setFilters] = useState<F>(initialFilters);
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(options.pageSize ?? 10);
  const [sort, setSortState] = useState<SortState | undefined>(options.sort);
  const debouncedSearch = useDebounce(search);

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);
  const setSearch = useCallback((v: string) => {
    setSearchState(v);
    setPage(1);
  }, []);
  const setSort = useCallback((s: SortState | undefined) => {
    setSortState(s);
    setPage(1);
  }, []);
  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPage(1);
  }, []);
  const reset = useCallback(() => {
    setFilters(initialFilters);
    setSearchState('');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = useMemo<ListParams>(
    () =>
      cleanParams({
        ...filters,
        q: debouncedSearch.trim(),
        page,
        pageSize,
        sort: sort?.key,
        dir: sort?.dir,
      }) as ListParams,
    [filters, debouncedSearch, page, pageSize, sort],
  );

  const activeFilterCount = Object.values(filters).filter((v) => v !== '' && v !== 'all').length + (search ? 1 : 0);

  return {
    filters,
    setFilter,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sort,
    setSort,
    reset,
    params,
    paramsKey: JSON.stringify(params),
    activeFilterCount,
  };
}
