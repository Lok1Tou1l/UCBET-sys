import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, Gauge, Sigma, XCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { recordsService } from '@/services/records.service';
import { ACADEMIC_LEVELS } from '@/types/common';
import { Badge, DataTable, FilterBar, FilterSelect, PageHeader, SearchInput, StatCard, type Column } from '@/components/ui';
import { StudentCell } from '@/modules/admissions/components/Badges';
import { LevelBadge, SemesterStatusBadge, VersionBadge } from '../components/Badges';
import { RulesPanel } from '../components/ResultsView';
import type { ResultRow, SemesterResultStatus } from '../types';

const STATUSES: SemesterResultStatus[] = ['validated', 'compensated', 'not_validated', 'in_progress'];

export default function ResultsPage() {
  const { t, loc, formatNumber } = useI18n();
  const navigate = useNavigate();
  const list = useListQuery({ academicYear: '', level: '', programId: '', status: '' }, { sort: { key: 'academicYear', dir: 'desc' } });
  const filters = useAsync(() => recordsService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => recordsService.results(list.params), [list.paramsKey]);
  const s = data?.summary;
  const programOpts = (filters.data?.programs ?? []).filter((p) => !list.filters.level || p.level === list.filters.level).map((p) => ({ value: p.id, label: `${loc(p.name, p.nameAr)} (${p.level})` }));

  const columns: Column<ResultRow>[] = [
    { key: 'studentName', header: t('rec.col.student'), sortable: true, cell: (r) => <StudentCell name={r.studentName} studentId={r.studentId} /> },
    { key: 'academicYear', header: t('rec.col.year'), sortable: true, cell: (r) => <div><p className="ltr-text font-semibold">{r.academicYear}</p><div className="mt-0.5"><LevelBadge level={r.level} /></div></div> },
    { key: 'programName', header: t('rec.col.program'), sortable: true, className: 'hidden lg:table-cell', cell: (r) => <div><p>{loc(r.programName, r.programNameAr)}</p><div className="mt-0.5"><VersionBadge label={r.versionLabel} current={r.isCurrentVersion} /></div></div> },
    { key: 'semesterNumber', header: t('rec.res.col.semester'), sortable: true, cell: (r) => r.semesterName },
    { key: 'average', header: t('rec.res.col.average'), sortable: true, align: 'center', cell: (r) => r.average === null ? '—' : <b className={r.average >= (data?.rules.passMark ?? 10) ? 'text-emerald-700' : 'text-rose-600'}>{formatNumber(r.average, { minimumFractionDigits: 2 })}</b> },
    { key: 'ue', header: t('rec.res.col.ue'), align: 'center', className: 'hidden md:table-cell', cell: (r) => r.average === null ? '—' : `${r.ueValidated}/${r.ueTotal}` },
    { key: 'creditsAcquired', header: t('rec.res.col.credits'), sortable: true, align: 'center', cell: (r) => `${r.creditsAcquired}/${r.creditsTotal}` },
    { key: 'status', header: t('common.status'), sortable: true, cell: (r) => <SemesterStatusBadge status={r.status} /> },
    { key: 'flags', header: t('rec.res.col.flags'), className: 'hidden xl:table-cell', cell: (r) => <div className="flex gap-1">{r.compensated && <Badge tone="cyan" dot={false}>{t('rec.res.compensation')}</Badge>}{r.resit && <Badge tone="orange" dot={false}>{t('rec.res.resit')}</Badge>}</div> },
  ];
  return (
    <>
      <PageHeader title={t('rec.res.title')} subtitle={t('rec.res.subtitle')} breadcrumbs={[{ label: t('rec.title'), to: '/records' }, { label: t('rec.res.title') }]} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpenCheck} tone="blue" label={t('rec.res.stat.rows')} value={s ? formatNumber(s.rows) : '…'} loading={!s} />
        <StatCard icon={CheckCircle2} tone="green" label={t('rec.res.stat.validated')} value={s ? formatNumber(s.validated + s.compensated) : '…'} loading={!s} hint={s ? `${s.compensated} ${t('rec.res.compensation').toLowerCase()}` : undefined} />
        <StatCard icon={XCircle} tone="red" label={t('rec.res.stat.notValidated')} value={s ? formatNumber(s.notValidated) : '…'} loading={!s} />
        <StatCard icon={Gauge} tone="purple" label={t('rec.res.stat.average')} value={s?.averageMark != null ? formatNumber(s.averageMark, { minimumFractionDigits: 2 }) : '—'} loading={!s} hint={s ? `${formatNumber(s.creditsAcquired)}/${formatNumber(s.creditsTotal)} ${t('rec.col.credits').toLowerCase()}` : undefined} />
      </div>
      {data && <div className="mb-5"><RulesPanel rules={data.rules} /></div>}
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('rec.res.search')} />
        <FilterSelect value={list.filters.academicYear} onChange={(v) => list.setFilter('academicYear', v)} allLabel={t('rec.f.allYears')} options={(filters.data?.academicYears ?? []).map((y) => ({ value: y, label: y }))} />
        <FilterSelect value={list.filters.level} onChange={(v) => { list.setFilter('level', v); list.setFilter('programId', ''); }} allLabel={t('rec.f.allLevels')} options={ACADEMIC_LEVELS.map((l) => ({ value: l, label: l }))} />
        <FilterSelect className="max-w-[230px]" value={list.filters.programId} onChange={(v) => list.setFilter('programId', v)} allLabel={t('rec.f.allPrograms')} options={programOpts} />
        <FilterSelect value={list.filters.status} onChange={(v) => list.setFilter('status', v)} allLabel={t('rec.res.allStatuses')} options={STATUSES.map((x) => ({ value: x, label: t(`rec.semStatus.${x}`) }))} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.page.items} rowKey={(r) => r.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort} page={list.page} pageSize={list.pageSize} total={data?.page.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} onRowClick={(r) => navigate(`/records/students/${r.studentRecordId}`)} minWidth={900} />
    </>
  );
}
