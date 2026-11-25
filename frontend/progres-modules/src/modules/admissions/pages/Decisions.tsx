import { Link, useNavigate } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { admissionsService } from '@/services/admissions.service';
import { Card, DataTable, FilterBar, FilterSelect, PageHeader, SearchInput, type Column } from '@/components/ui';
import { DecisionBadge, StudentCell } from '../components/Badges';
import type { DecisionKind, DecisionRecord } from '../types';

const KINDS: DecisionKind[] = ['accept', 'reject', 'request_correction', 'start_review'];

export default function Decisions() {
  const { t, loc, formatDateTime } = useI18n();
  const navigate = useNavigate();
  const list = useListQuery({ decision: '' }, { sort: { key: 'at', dir: 'desc' } });
  const { data, loading, error, reload } = useAsync(() => admissionsService.listDecisions(list.params), [list.paramsKey]);
  const pending = useAsync(() => admissionsService.listApplications({ status: 'under_review', pageSize: 1 }), []);

  const columns: Column<DecisionRecord>[] = [
    { key: 'studentName', header: t('adm.col.student'), sortable: true, cell: (d) => <StudentCell name={d.studentName} sub={d.reference} /> },
    { key: 'program', header: t('adm.col.program'), className: 'hidden lg:table-cell', cell: (d) => <span>{loc(d.programName, d.programNameAr)} <span className="text-xs font-semibold text-slate-400">· {d.level}</span></span> },
    { key: 'decision', header: t('adm.dec.col.decision'), sortable: true, cell: (d) => <DecisionBadge decision={d.decision} /> },
    { key: 'comment', header: t('adm.dec.col.comment'), className: 'hidden xl:table-cell max-w-[320px]', cell: (d) => <span className="line-clamp-2 text-slate-600">{d.comment ?? '—'}</span> },
    { key: 'actor', header: t('adm.dec.col.actor'), sortable: true, className: 'hidden md:table-cell', cell: (d) => d.actor },
    { key: 'at', header: t('adm.dec.col.date'), sortable: true, cell: (d) => formatDateTime(d.at) },
  ];

  return (
    <>
      <PageHeader title={t('adm.dec.title')} subtitle={t('adm.dec.subtitle')} breadcrumbs={[{ label: t('adm.title'), to: '/admissions' }, { label: t('adm.dec.title') }]} />
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Gavel className="h-5 w-5" /></span>
          <div>
            <p className="font-bold text-navy-900">{t('adm.dec.pending')}</p>
            <p className="text-sm text-slate-500">{pending.data ? t('adm.dec.pendingHint', { n: pending.data.total }) : t('common.loading')}</p>
          </div>
        </div>
        <Link to="/admissions/applications?status=under_review" className="text-sm font-semibold text-brand-600 hover:underline">{t('adm.dec.goToQueue')} →</Link>
      </Card>
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-72" value={list.search} onChange={list.setSearch} placeholder={t('adm.dec.search')} />
        <FilterSelect value={list.filters.decision} onChange={(v) => list.setFilter('decision', v)} allLabel={t('adm.dec.allDecisions')} options={KINDS.map((k) => ({ value: k, label: t(`adm.decision.${k}`) }))} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.items} rowKey={(d) => d.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort} page={list.page} pageSize={list.pageSize} total={data?.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} onRowClick={(d) => navigate(`/admissions/applications/${d.applicationId}`)} minWidth={760} />
    </>
  );
}
