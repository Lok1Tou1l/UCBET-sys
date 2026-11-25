import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Inbox } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { admissionsService } from '@/services/admissions.service';
import { ACADEMIC_LEVELS } from '@/types/common';
import { Button, DataTable, DateInput, FilterBar, FilterSelect, PageHeader, SearchInput, type Column } from '@/components/ui';
import { ApplicationStatusBadge, CompletionCell, StudentCell } from '../components/Badges';
import { REGISTRAR_STATUSES, type ApplicationListItem } from '../types';

export default function ApplicationQueue() {
  const { t, loc, formatDate } = useI18n();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const list = useListQuery({ academicYear: '', level: '', programId: '', status: sp.get('status') ?? '', dateFrom: '', dateTo: '' }, { sort: { key: 'submittedAt', dir: 'desc' } });
  const filters = useAsync(() => admissionsService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => admissionsService.listApplications(list.params), [list.paramsKey]);

  // react to links such as /admissions/applications?status=under_review while already on the page
  const urlStatus = sp.get('status') ?? '';
  useEffect(() => {
    list.setFilter('status', urlStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  const programOptions = (filters.data?.programs ?? [])
    .filter((p) => !list.filters.level || p.level === list.filters.level)
    .map((p) => ({ value: p.id, label: `${loc(p.name, p.nameAr)} (${p.level})` }));

  const columns: Column<ApplicationListItem>[] = [
    { key: 'studentName', header: t('adm.col.student'), sortable: true, cell: (a) => <StudentCell name={a.studentName} sub={a.reference} /> },
    { key: 'studentId', header: t('adm.col.studentId'), sortable: true, className: 'hidden lg:table-cell', cell: (a) => <span className="ltr-text font-mono text-xs text-slate-600">{a.studentId}</span> },
    { key: 'academicYear', header: t('adm.col.year'), sortable: true, className: 'hidden xl:table-cell', cell: (a) => <span className="ltr-text">{a.academicYear}</span> },
    { key: 'programName', header: t('adm.col.program'), sortable: true, cell: (a) => <div><p className="font-medium text-slate-800">{loc(a.programName, a.programNameAr)}</p><p className="text-xs text-slate-500">{loc(a.specialty, a.specialtyAr)}</p></div> },
    { key: 'level', header: t('adm.col.level'), sortable: true, cell: (a) => <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{a.level}</span> },
    { key: 'submittedAt', header: t('adm.col.submitted'), sortable: true, className: 'hidden md:table-cell', cell: (a) => formatDate(a.submittedAt) },
    { key: 'status', header: t('adm.col.status'), sortable: true, cell: (a) => <ApplicationStatusBadge status={a.status} /> },
    { key: 'completion', header: t('adm.col.documents'), sortable: true, className: 'hidden lg:table-cell', cell: (a) => <CompletionCell completion={a.completion} /> },
    { key: 'actions', header: '', align: 'end', cell: (a) => <Button variant="soft" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={(e) => { e.stopPropagation(); navigate(`/admissions/applications/${a.id}`); }}>{t('action.view')}</Button> },
  ];

  return (
    <>
      <PageHeader title={t('adm.queue.title')} subtitle={t('adm.queue.subtitle')} breadcrumbs={[{ label: t('adm.title'), to: '/admissions' }, { label: t('adm.queue.title') }]} />
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-72" value={list.search} onChange={list.setSearch} placeholder={t('adm.queue.search')} />
        <FilterSelect value={list.filters.academicYear} onChange={(v) => list.setFilter('academicYear', v)} allLabel={t('adm.queue.allYears')} options={(filters.data?.academicYears ?? []).map((y) => ({ value: y, label: y }))} />
        <FilterSelect value={list.filters.level} onChange={(v) => { list.setFilter('level', v); list.setFilter('programId', ''); }} allLabel={t('adm.queue.allLevels')} options={ACADEMIC_LEVELS.map((l) => ({ value: l, label: l }))} />
        <FilterSelect className="max-w-[230px]" value={list.filters.programId} onChange={(v) => list.setFilter('programId', v)} allLabel={t('adm.queue.allPrograms')} options={programOptions} />
        <FilterSelect value={list.filters.status} onChange={(v) => list.setFilter('status', v)} allLabel={t('adm.queue.allStatuses')} options={REGISTRAR_STATUSES.map((s) => ({ value: s, label: t(`adm.status.${s}`) }))} />
        <DateInput label={`${t('common.from')}`} value={list.filters.dateFrom} max={list.filters.dateTo || undefined} onChange={(v) => list.setFilter('dateFrom', v)} />
        <DateInput label={`${t('common.to')}`} value={list.filters.dateTo} min={list.filters.dateFrom || undefined} onChange={(v) => list.setFilter('dateTo', v)} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(a) => a.id}
        loading={loading}
        error={error}
        onRetry={reload}
        sort={list.sort}
        onSortChange={list.setSort}
        page={list.page}
        pageSize={list.pageSize}
        total={data?.total}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        onRowClick={(a) => navigate(`/admissions/applications/${a.id}`)}
        emptyTitle={t('adm.queue.empty')}
        emptyAction={list.activeFilterCount > 0 ? <Button variant="secondary" size="sm" onClick={list.reset}>{t('action.reset')}</Button> : undefined}
        minWidth={900}
      />
    </>
  );
}
