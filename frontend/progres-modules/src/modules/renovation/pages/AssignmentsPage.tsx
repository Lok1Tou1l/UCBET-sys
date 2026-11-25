import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { renovationService } from '@/services/renovation.service';
import { Badge, DataTable, FilterBar, FilterSelect, PageHeader, SearchInput, Tabs, type Column } from '@/components/ui';
import type { Assignment } from '../types';

export default function AssignmentsPage() {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const list = useListQuery({ current: '', contractorId: '', projectId: '' }, { sort: { key: 'assignedAt', dir: 'desc' } });
  const { data: filters } = useAsync(() => renovationService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => renovationService.listAssignments(list.params), [list.paramsKey], { keepPrevious: true });
  const scope = list.filters.current || 'all';
  const cols: Column<Assignment>[] = [
    { key: 'projectTitle', header: t('ren.asg.col.project'), sortable: true, cell: (a) => <span className="font-semibold text-navy-900">{a.projectTitle}</span> },
    { key: 'contractorName', header: t('ren.asg.col.contractor'), sortable: true, cell: (a) => a.contractorName },
    { key: 'assignedAt', header: t('ren.asg.col.assigned'), sortable: true, className: 'hidden md:table-cell', cell: (a) => formatDate(a.assignedAt) },
    { key: 'endedAt', header: t('ren.asg.col.ended'), className: 'hidden md:table-cell', cell: (a) => (a.endedAt ? formatDate(a.endedAt) : '—') },
    { key: 'by', header: t('ren.asg.col.by'), className: 'hidden lg:table-cell', cell: (a) => a.assignedBy },
    { key: 'state', header: t('ren.asg.col.state'), cell: (a) => <Badge tone={a.current ? 'green' : 'slate'}>{a.current ? t('ren.asg.current') : t('ren.asg.past')}</Badge> },
  ];
  return (
    <>
      <PageHeader title={t('ren.asg.title')} subtitle={t('ren.asg.subtitle')} breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.asg.title') }]} />
      <Tabs className="mb-4" active={scope} onChange={(id) => list.setFilter('current', id === 'all' ? '' : id)}
        tabs={[{ id: 'all', label: t('ren.asg.scope.all') }, { id: 'true', label: t('ren.asg.scope.current') }, { id: 'false', label: t('ren.asg.scope.past') }]} />
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('ren.asg.search')} />
        <FilterSelect value={list.filters.contractorId} onChange={(v) => list.setFilter('contractorId', v)} allLabel={t('ren.asg.allContractors')} options={(filters?.contractors ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect value={list.filters.projectId} onChange={(v) => list.setFilter('projectId', v)} allLabel={t('ren.asg.allProjects')} options={(filters?.projects ?? []).map((p) => ({ value: p.id, label: p.title }))} />
      </FilterBar>
      <DataTable columns={cols} rows={data?.items} rowKey={(a) => a.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort} onRowClick={(a) => navigate(`/renovation/projects/${a.projectId}?tab=contractor`)}
        page={list.page} pageSize={list.pageSize} total={data?.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} minWidth={640} />
    </>
  );
}
