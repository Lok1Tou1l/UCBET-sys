import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { recordsService } from '@/services/records.service';
import { ACADEMIC_LEVELS } from '@/types/common';
import { Button, DataTable, FilterBar, FilterSelect, PageHeader, ProgressBar, SearchInput, type Column } from '@/components/ui';
import { StudentCell } from '@/modules/admissions/components/Badges';
import { EnrollmentStatusBadge, LevelBadge } from '../components/Badges';
import { ENROLLMENT_STATUSES, type StudentListItem } from '../types';

export default function StudentSearch() {
  const { t, loc, formatDate, formatNumber } = useI18n();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const list = useListQuery({ academicYear: '', specialtyId: '', programId: '', level: sp.get('level') ?? '', enrollmentStatus: sp.get('enrollmentStatus') ?? '' }, { sort: { key: 'name', dir: 'asc' } });
  const filters = useAsync(() => recordsService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => recordsService.listStudents(list.params), [list.paramsKey]);

  const programOpts = (filters.data?.programs ?? []).filter((p) => (!list.filters.level || p.level === list.filters.level) && (!list.filters.specialtyId || p.specialtyId === list.filters.specialtyId)).map((p) => ({ value: p.id, label: `${loc(p.name, p.nameAr)} (${p.level})` }));
  const columns: Column<StudentListItem>[] = [
    { key: 'name', header: t('rec.col.student'), sortable: true, cell: (s) => <StudentCell name={s.name} studentId={s.studentId} /> },
    { key: 'programName', header: t('rec.col.program'), sortable: true, cell: (s) => <div><p className="font-medium text-slate-800">{loc(s.programName, s.programNameAr)}</p><p className="text-xs text-slate-500">{loc(s.specialty, s.specialtyAr)}</p></div> },
    { key: 'level', header: t('rec.col.level'), sortable: true, cell: (s) => <LevelBadge level={s.level} /> },
    { key: 'academicYear', header: t('rec.col.year'), sortable: true, className: 'hidden lg:table-cell', cell: (s) => <span className="ltr-text">{s.academicYear}</span> },
    { key: 'enrollmentStatus', header: t('rec.col.status'), sortable: true, cell: (s) => <EnrollmentStatusBadge status={s.enrollmentStatus} /> },
    { key: 'creditsAcquired', header: t('rec.col.credits'), sortable: true, className: 'hidden xl:table-cell', cell: (s) => <div className="w-32"><ProgressBar value={(s.creditsAcquired / s.creditsTarget) * 100} showLabel={false} /><p className="mt-1 text-xs text-slate-500">{s.creditsAcquired}/{s.creditsTarget}</p></div> },
    { key: 'updatedAt', header: t('rec.col.updated'), sortable: true, className: 'hidden 2xl:table-cell', cell: (s) => formatDate(s.updatedAt) },
    { key: 'open', header: '', align: 'end', cell: (s) => <Button size="sm" variant="soft" icon={<FolderOpen className="h-3.5 w-3.5" />} onClick={(e) => { e.stopPropagation(); navigate(`/records/students/${s.id}`); }}>{t('action.view')}</Button> },
  ];
  return (
    <>
      <PageHeader title={t('rec.students.title')} subtitle={t('rec.students.subtitle')} breadcrumbs={[{ label: t('rec.title'), to: '/records' }, { label: t('rec.students.title') }]} badge={data && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{t('rec.students.count', { n: formatNumber(data.total) })}</span>} />
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-72" value={list.search} onChange={list.setSearch} placeholder={t('rec.students.search')} />
        <FilterSelect value={list.filters.academicYear} onChange={(v) => list.setFilter('academicYear', v)} allLabel={t('rec.f.allYears')} options={(filters.data?.academicYears ?? []).map((y) => ({ value: y, label: y }))} />
        <FilterSelect value={list.filters.level} onChange={(v) => { list.setFilter('level', v); list.setFilter('programId', ''); }} allLabel={t('rec.f.allLevels')} options={ACADEMIC_LEVELS.map((l) => ({ value: l, label: l }))} />
        <FilterSelect className="max-w-[210px]" value={list.filters.specialtyId} onChange={(v) => { list.setFilter('specialtyId', v); list.setFilter('programId', ''); }} allLabel={t('rec.f.allSpecialties')} options={(filters.data?.specialties ?? []).map((s) => ({ value: s.id, label: loc(s.name, s.nameAr) }))} />
        <FilterSelect className="max-w-[230px]" value={list.filters.programId} onChange={(v) => list.setFilter('programId', v)} allLabel={t('rec.f.allPrograms')} options={programOpts} />
        <FilterSelect value={list.filters.enrollmentStatus} onChange={(v) => list.setFilter('enrollmentStatus', v)} allLabel={t('rec.students.allStatuses')} options={ENROLLMENT_STATUSES.map((s) => ({ value: s, label: t(`rec.enrollment.${s}`) }))} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.items} rowKey={(s) => s.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort} page={list.page} pageSize={list.pageSize} total={data?.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} onRowClick={(s) => navigate(`/records/students/${s.id}`)} minWidth={900} />
    </>
  );
}
