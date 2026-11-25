import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Pencil, Plus, Table2, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { renovationService } from '@/services/renovation.service';
import { Avatar, DataTable, ErrorState, FilterBar, FilterSelect, IconButton, NoResults, PageHeader, Pagination, SearchInput, Skeleton, Button, type Column } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Can } from '@/auth/RequirePermission';
import { ContractorStatusBadge } from '../components/Badges';
import { ContractorFormDialog } from '../components/ContractorFormDialog';
import { CONTRACTOR_STATUSES, type Contractor } from '../types';

export default function ContractorDirectory() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [form, setForm] = useState<{ open: boolean; item: Contractor | null }>({ open: false, item: null });
  const list = useListQuery({ status: sp.get('status') ?? '', activity: '' }, { sort: { key: 'companyName', dir: 'asc' } });
  const { data: filters, reload: reloadFilters } = useAsync(() => renovationService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => renovationService.listContractors(list.params), [list.paramsKey], { keepPrevious: true });
  const cols: Column<Contractor>[] = [
    { key: 'companyName', header: t('ren.ctr.company'), sortable: true, cell: (c) => <div className="flex items-center gap-3"><Avatar name={c.companyName} /><div className="min-w-0"><p className="truncate font-semibold text-navy-900">{c.companyName}</p><p className="truncate text-xs text-slate-500">{c.city}</p></div></div> },
    { key: 'activity', header: t('ren.ctr.activity'), sortable: true, className: 'hidden md:table-cell', cell: (c) => c.activity },
    { key: 'contactPerson', header: t('ren.ctr.contact'), sortable: true, className: 'hidden lg:table-cell', cell: (c) => <div><p>{c.contactPerson}</p><p className="ltr-text text-xs text-slate-500">{c.email}</p></div> },
    { key: 'projectCount', header: t('ren.ctr.projects'), sortable: true, className: 'hidden sm:table-cell', cell: (c) => <span className="font-semibold">{c.projectCount}<span className="font-normal text-slate-400"> ({c.activeProjectCount})</span></span> },
    { key: 'status', header: t('common.status'), sortable: true, cell: (c) => <ContractorStatusBadge status={c.status} /> },
    { key: 'actions', header: '', align: 'end', cell: (c) => <Can permission="renovation.manage"><IconButton label={t('action.edit')} onClick={(e) => { e.stopPropagation(); setForm({ open: true, item: c }); }}><Pencil className="h-4 w-4" /></IconButton></Can> },
  ];
  const refresh = () => { reload(); reloadFilters(); };
  return (
    <>
      <PageHeader title={t('ren.ctr.title')} subtitle={t('ren.ctr.subtitle')} breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.ctr.title') }]}
        actions={<Can permission="renovation.manage"><Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, item: null })}>{t('ren.ctr.new')}</Button></Can>} />
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('ren.ctr.search')} />
        <FilterSelect value={list.filters.status} onChange={(v) => list.setFilter('status', v)} allLabel={t('ren.ctr.allStatuses')} options={CONTRACTOR_STATUSES.map((s) => ({ value: s, label: t(`ren.cstatus.${s}`) }))} />
        <FilterSelect value={list.filters.activity} onChange={(v) => list.setFilter('activity', v)} allLabel={t('ren.ctr.allActivities')} options={(filters?.activities ?? []).map((a) => ({ value: a, label: a }))} />
        <div className="ms-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {([['table', Table2, t('ren.view.table')], ['cards', LayoutGrid, t('ren.view.cards')]] as const).map(([id, Icon, label]) => (
            <button key={id} aria-label={label} title={label} onClick={() => setView(id)} className={cn('rounded-md p-2', view === id ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100')}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      </FilterBar>
      {view === 'table' ? (
        <DataTable columns={cols} rows={data?.items} rowKey={(c) => c.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort} onRowClick={(c) => navigate(`/renovation/contractors/${c.id}`)}
          emptyTitle={t('ren.ctr.empty')} page={list.page} pageSize={list.pageSize} total={data?.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} minWidth={680} />
      ) : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {!data && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            {data?.items.map((c) => (
              <Link key={c.id} to={`/renovation/contractors/${c.id}`} className="group animate-slide-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
                <div className="flex items-start gap-3"><Avatar name={c.companyName} size="lg" /><div className="min-w-0 flex-1"><p className="truncate font-bold text-navy-900 group-hover:text-brand-700">{c.companyName}</p><p className="truncate text-sm text-slate-500">{c.activity}</p></div><ContractorStatusBadge status={c.status} /></div>
                <div className="mt-3 space-y-1 text-xs text-slate-500"><p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="ltr-text truncate">{c.email}</span></p><p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span className="ltr-text">{c.phone}</span></p></div>
                <p className="mt-3 text-xs font-semibold text-slate-600">{c.projectCount} {t('ren.ctr.projects').toLowerCase()} · {c.activeProjectCount} {t('ren.ctr.activeProjects').toLowerCase()}</p>
              </Link>
            ))}
          </div>
          {data && data.items.length === 0 && <NoResults onReset={list.reset} />}
          {data && data.total > 0 && <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"><Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></div>}
        </>
      )}
      <ContractorFormDialog open={form.open} contractor={form.item} onClose={() => setForm({ open: false, item: null })} onSaved={refresh} />
    </>
  );
}
