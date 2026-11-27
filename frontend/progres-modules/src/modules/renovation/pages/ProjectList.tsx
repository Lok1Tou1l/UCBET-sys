import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Plus, Table2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { renovationService } from '@/services/renovation.service';
import { DataTable, DateInput, ErrorState, FilterBar, FilterSelect, NoResults, PageHeader, Pagination, ProgressBar, SearchInput, Skeleton, type Column } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Can } from '@/auth/RequirePermission';
import { ProjectStatusBadge } from '../components/Badges';
import { ProjectCell } from '../components/ProjectCell';
import { ProjectThumb } from '../components/Badges';
import { PROJECT_STATUSES, type ProjectListItem } from '../types';

export default function ProjectList() {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const list = useListQuery({ status: sp.get('status') ?? '', location: '', contractorId: '', dateFrom: '', dateTo: '' }, { sort: { key: 'updatedAt', dir: 'desc' } });
  const { data: filters } = useAsync(() => renovationService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => renovationService.listProjects(list.params), [list.paramsKey], { keepPrevious: true });
  const cols: Column<ProjectListItem>[] = [
    { key: 'title', header: t('ren.col.project'), sortable: true, cell: (p) => <ProjectCell p={p} /> },
    { key: 'startDate', header: t('ren.col.start'), sortable: true, className: 'hidden md:table-cell', cell: (p) => formatDate(p.startDate) },
    { key: 'expectedEndDate', header: t('ren.col.end'), sortable: true, className: 'hidden lg:table-cell', cell: (p) => formatDate(p.expectedEndDate) },
    { key: 'contractorName', header: t('ren.col.contractor'), sortable: true, className: 'hidden lg:table-cell', cell: (p) => p.contractorName ?? <span className="text-slate-400">{t('ren.unassigned')}</span> },
    { key: 'status', header: t('ren.col.status'), sortable: true, cell: (p) => <ProjectStatusBadge status={p.status} /> },
    { key: 'progress', header: t('ren.col.progress'), sortable: true, className: 'hidden sm:table-cell w-44', cell: (p) => <ProgressBar value={p.progress} /> },
  ];
  return (
    <>
      <PageHeader title={t('ren.projects.title')} subtitle={t('ren.projects.subtitle')} breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.projects.title') }]}
        actions={<Can permission="renovation.manage"><Link to="/renovation/projects/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700"><Plus className="h-4 w-4" />{t('ren.projects.new')}</Link></Can>} />
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('ren.projects.search')} />
        <FilterSelect value={list.filters.status} onChange={(v) => list.setFilter('status', v)} allLabel={t('ren.projects.allStatuses')} options={PROJECT_STATUSES.map((s) => ({ value: s, label: t(`ren.status.${s}`) }))} />
        <FilterSelect value={list.filters.location} onChange={(v) => list.setFilter('location', v)} allLabel={t('ren.projects.allLocations')} options={(filters?.locations ?? []).map((l) => ({ value: l, label: l }))} />
        <FilterSelect value={list.filters.contractorId} onChange={(v) => list.setFilter('contractorId', v)} allLabel={t('ren.projects.allContractors')} options={(filters?.contractors ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        <DateInput label={t('ren.projects.startFrom')} value={list.filters.dateFrom} onChange={(v) => list.setFilter('dateFrom', v)} max={list.filters.dateTo || undefined} />
        <DateInput label={t('ren.projects.startTo')} value={list.filters.dateTo} onChange={(v) => list.setFilter('dateTo', v)} min={list.filters.dateFrom || undefined} />
        <div className="ms-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {([['table', Table2, t('ren.view.table')], ['cards', LayoutGrid, t('ren.view.cards')]] as const).map(([id, Icon, label]) => (
            <button key={id} aria-label={label} title={label} onClick={() => setView(id)} className={cn('rounded-md p-2', view === id ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100')}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      </FilterBar>
      {view === 'table' ? (
        <DataTable columns={cols} rows={data?.items} rowKey={(p) => p.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort}
          onRowClick={(p) => navigate(`/renovation/projects/${p.id}`)} emptyTitle={t('ren.projects.empty')} page={list.page} pageSize={list.pageSize} total={data?.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} minWidth={720} />
      ) : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {!data && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            {data?.items.map((p) => (
              <Link key={p.id} to={`/renovation/projects/${p.id}`} className="group animate-slide-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
                <div className="flex items-start gap-3"><ProjectThumb seed={p.id} size={56} /><div className="min-w-0 flex-1"><p className="line-clamp-2 font-bold text-navy-900 group-hover:text-brand-700">{p.title}</p><p className="truncate text-xs text-slate-500">{p.location}</p></div></div>
                <div className="mt-3 flex items-center justify-between"><ProjectStatusBadge status={p.status} /><span className="text-xs text-slate-500">{formatDate(p.expectedEndDate)}</span></div>
                <div className="mt-3"><ProgressBar value={p.progress} /></div>
                <p className="mt-2 truncate text-xs text-slate-500">{p.contractorName ?? t('ren.unassigned')}</p>
              </Link>
            ))}
          </div>
          {data && data.items.length === 0 && <NoResults onReset={list.reset} />}
          {data && data.total > 0 && <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"><Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></div>}
        </>
      )}
    </>
  );
}
