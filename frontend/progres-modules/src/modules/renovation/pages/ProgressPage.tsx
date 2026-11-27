import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Plus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { renovationService } from '@/services/renovation.service';
import { Button, Card, CardHeader, EmptyState, ErrorState, FilterBar, FilterSelect, NoResults, PageHeader, Pagination, ProgressBar, SearchInput, Skeleton, Timeline } from '@/components/ui';
import { Can } from '@/auth/RequirePermission';
import { PhaseBadge, ProjectStatusBadge } from '../components/Badges';
import { ProjectCell } from '../components/ProjectCell';
import { ProgressFormDialog } from '../components/ProgressFormDialog';
import { PROJECT_PHASES, type ProjectListItem } from '../types';

export default function ProgressPage() {
  const { t, formatDate } = useI18n();
  const [target, setTarget] = useState<ProjectListItem | null>(null);
  const active = useAsync(() => renovationService.listProjects({ status: 'active', pageSize: 50, sort: 'progress', dir: 'asc' }), []);
  const list = useListQuery({ projectId: '', phase: '' }, { pageSize: 8 });
  const { data: filters } = useAsync(() => renovationService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => renovationService.listProgress(list.params), [list.paramsKey], { keepPrevious: true });
  const refresh = () => { active.reload(); reload(); };
  return (
    <>
      <PageHeader title={t('ren.progress.global.title')} subtitle={t('ren.progress.global.subtitle')} breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.progress.global.title') }]} />
      <Card className="mb-6">
        <CardHeader title={t('ren.progress.global.activeProjects')} icon={Activity} />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {!active.data && active.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          {active.data?.items.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-3">
              <Link to={`/renovation/projects/${p.id}`} className="block"><ProjectCell p={p} /></Link>
              <div className="mt-3"><ProgressBar value={p.progress} /></div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{t('ren.progress.global.lastUpdate')}: {p.lastProgressAt ? formatDate(p.lastProgressAt) : t('ren.progress.global.never')}</span>
                <Can permission="renovation.manage"><Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setTarget(p)}>{t('ren.progress.global.update')}</Button></Can>
              </div>
            </div>
          ))}
          {active.data && !active.data.items.length && <EmptyState compact title={t('ren.projects.empty')} description=" " />}
        </div>
      </Card>
      <h2 className="mb-3 text-lg font-bold text-navy-900">{t('ren.progress.global.updates')}</h2>
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('ren.progress.global.search')} />
        <FilterSelect value={list.filters.projectId} onChange={(v) => list.setFilter('projectId', v)} allLabel={t('ren.progress.global.allProjects')} options={(filters?.projects ?? []).map((p) => ({ value: p.id, label: p.title }))} />
        <FilterSelect value={list.filters.phase} onChange={(v) => list.setFilter('phase', v)} allLabel={t('ren.progress.global.allPhases')} options={PROJECT_PHASES.map((p) => ({ value: p, label: t(`ren.phase.${p}`) }))} />
      </FilterBar>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <Card>
          <div className="p-5">
            {!data ? <Skeleton className="h-40" /> : data.items.length === 0 ? <NoResults onReset={list.reset} /> : (
              <Timeline items={data.items.map((u) => ({ id: u.id, title: <Link className="hover:text-brand-700 hover:underline" to={`/renovation/projects/${u.projectId}?tab=progress`}>{u.projectTitle} <span className="text-brand-600">· {u.progress}%</span></Link>, time: formatDate(u.updateDate), meta: <span className="inline-flex flex-wrap items-center gap-2"><PhaseBadge phase={u.phase} /><ProjectStatusBadge status={u.status} /><span>{u.author.name}</span></span>, body: u.note, tone: 'blue' as const }))} />
            )}
          </div>
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} pageSizeOptions={[8, 16, 32]} />}
        </Card>
      )}
      <ProgressFormDialog open={!!target} project={target} onClose={() => setTarget(null)} onDone={refresh} />
    </>
  );
}
