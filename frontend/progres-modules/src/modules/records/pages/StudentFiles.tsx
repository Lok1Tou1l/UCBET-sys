import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { recordsService } from '@/services/records.service';
import { Avatar, ErrorState, FilterBar, NoResults, PageHeader, Pagination, ProgressBar, SearchInput, Skeleton, Tabs } from '@/components/ui';
import { EnrollmentStatusBadge, LevelBadge } from '../components/Badges';
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from '../types';

const SORTS = { recent: { key: 'updatedAt', dir: 'desc' as const }, name: { key: 'name', dir: 'asc' as const }, credits: { key: 'creditsAcquired', dir: 'desc' as const } };

export default function StudentFiles() {
  const { t, loc, formatDate } = useI18n();
  const list = useListQuery({ enrollmentStatus: '', sortMode: 'recent' }, { pageSize: 12 });
  const sortKey = (list.filters.sortMode || 'recent') as keyof typeof SORTS;
  const params = { ...list.params, sort: SORTS[sortKey].key, dir: SORTS[sortKey].dir };
  delete (params as any).sortMode;
  const { data, loading, error, reload } = useAsync(() => recordsService.listStudents(params), [JSON.stringify(params)]);
  const status = (list.filters.enrollmentStatus || 'all') as EnrollmentStatus | 'all';
  return (
    <>
      <PageHeader title={t('rec.files.title')} subtitle={t('rec.files.subtitle')} breadcrumbs={[{ label: t('rec.title'), to: '/records' }, { label: t('rec.files.title') }]} />
      <Tabs className="mb-4" active={status} onChange={(id) => list.setFilter('enrollmentStatus', id === 'all' ? '' : id)} tabs={[{ id: 'all', label: t('rec.files.tabAll') }, ...ENROLLMENT_STATUSES.map((s) => ({ id: s, label: t(`rec.enrollment.${s}`) }))] as { id: EnrollmentStatus | 'all'; label: string }[]} />
      <FilterBar>
        <SearchInput className="w-full sm:w-72" value={list.search} onChange={list.setSearch} placeholder={t('rec.students.search')} />
        <select aria-label={t('common.sortBy')} value={sortKey} onChange={(e) => list.setFilter('sortMode', e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
          <option value="recent">{t('rec.files.sortRecent')}</option><option value="name">{t('rec.files.sortName')}</option><option value="credits">{t('rec.files.sortCredits')}</option>
        </select>
      </FilterBar>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {!data && loading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            {data?.items.map((s) => (
              <Link key={s.id} to={`/records/students/${s.id}`} className="group animate-slide-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} size="lg" />
                  <div className="min-w-0 flex-1"><p className="truncate font-bold text-navy-900 group-hover:text-brand-700">{s.name}</p><p className="ltr-text font-mono text-xs text-slate-500">{s.studentId}</p></div>
                  <EnrollmentStatusBadge status={s.enrollmentStatus} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600"><LevelBadge level={s.level} /><span className="truncate">{loc(s.specialty, s.specialtyAr)}</span></div>
                <div className="mt-3"><ProgressBar value={(s.creditsAcquired / s.creditsTarget) * 100} showLabel={false} /><div className="mt-1 flex justify-between text-xs text-slate-500"><span>{s.creditsAcquired}/{s.creditsTarget} {t('rec.col.credits').toLowerCase()}</span><span>{formatDate(s.updatedAt)}</span></div></div>
              </Link>
            ))}
          </div>
          {data && data.items.length === 0 && <NoResults onReset={list.reset} />}
          {data && data.total > 0 && <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"><Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPageChange={list.setPage} pageSizeOptions={[12, 24, 48]} onPageSizeChange={list.setPageSize} /></div>}
        </>
      )}
    </>
  );
}
