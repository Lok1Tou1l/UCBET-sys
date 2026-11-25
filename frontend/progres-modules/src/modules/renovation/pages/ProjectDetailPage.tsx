import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, Building2, FileText, History, Info, Pencil, Plus, UploadCloud, UserCog } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { renovationService } from '@/services/renovation.service';
import { Avatar, Button, Card, CardHeader, CardBody, DescriptionList, EmptyState, ErrorState, NotFound, PageHeader, PageSkeleton, ProgressBar, Tabs, Timeline } from '@/components/ui';
import { Can } from '@/auth/RequirePermission';
import { isApiNotFound } from '../utils';
import { ContractorStatusBadge, PhaseBadge, ProjectStatusBadge, ProjectThumb, projectTone } from '../components/Badges';
import { StatusDialog } from '../components/StatusDialog';
import { AssignDialog } from '../components/AssignDialog';
import { ProgressFormDialog } from '../components/ProgressFormDialog';
import { DocumentsList, UploadDialog } from '../components/DocumentsPanel';
import type { ProjectDetail, ProjectStatus } from '../types';

type Tab = 'overview' | 'contractor' | 'progress' | 'documents';
const CLOSED: ProjectStatus[] = ['completed', 'cancelled'];

export default function ProjectDetailPage() {
  const { id = '' } = useParams();
  const { t, formatDate, formatDateTime, formatNumber } = useI18n();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'overview';
  const { data: project, error, reload, setData } = useAsync(() => renovationService.getProject(id), [id]);
  const progress = useAsync(() => renovationService.listProjectProgress(id), [id]);
  const assignments = useAsync(() => renovationService.listProjectAssignments(id), [id]);
  const docs = useAsync(() => renovationService.listProjectDocuments(id), [id]);
  const [target, setTarget] = useState<ProjectStatus | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  if (error && !project) return isApiNotFound(error) ? <NotFound /> : <ErrorState error={error} onRetry={reload} />;
  if (!project) return <PageSkeleton />;
  const closed = CLOSED.includes(project.status);
  const refreshAll = () => { reload(); progress.reload(); assignments.reload(); docs.reload(); };
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.round((new Date(project.expectedEndDate).getTime() - new Date(today).getTime()) / 86400000);
  const duration = Math.round((new Date(project.expectedEndDate).getTime() - new Date(project.startDate).getTime()) / 86400000);

  return (
    <>
      <PageHeader
        title={project.title}
        subtitle={<span className="inline-flex flex-wrap items-center gap-2"><span className="ltr-text font-mono">{project.reference}</span> · {project.location}</span>}
        badge={<ProjectStatusBadge status={project.status} />}
        breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.projects.title'), to: '/renovation/projects' }, { label: project.reference }]}
        actions={<Can permission="renovation.manage"><Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(`/renovation/projects/${project.id}/edit`)}>{t('ren.detail.edit')}</Button></Can>}
      />
      <Tabs className="mb-5" active={tab} onChange={(id) => setSp(id === 'overview' ? {} : { tab: id }, { replace: true })}
        tabs={[
          { id: 'overview', label: t('ren.detail.tab.overview'), icon: Info },
          { id: 'contractor', label: t('ren.detail.tab.contractor'), icon: Building2 },
          { id: 'progress', label: t('ren.detail.tab.progress'), icon: Activity, count: project.progressUpdateCount },
          { id: 'documents', label: t('ren.detail.tab.documents'), icon: FileText, count: project.documentCount },
        ]} />

      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader title={t('ren.detail.overview')} icon={Info} />
              <CardBody>
                <div className="mb-5 flex items-center gap-4"><ProjectThumb seed={project.id} size={72} /><div className="min-w-0 flex-1"><p className="mb-1 text-sm text-slate-500">{t('ren.detail.currentProgress')}</p><ProgressBar value={project.progress} /></div></div>
                <DescriptionList items={[
                  { label: t('ren.detail.reference'), value: <span className="ltr-text font-mono">{project.reference}</span> },
                  { label: t('ren.detail.phase'), value: <PhaseBadge phase={project.phase} /> },
                  { label: t('ren.col.location'), value: project.location },
                  { label: t('ren.col.contractor'), value: project.contractorName ?? t('ren.unassigned') },
                  { label: t('ren.col.start'), value: formatDate(project.startDate) },
                  { label: t('ren.col.end'), value: <>{formatDate(project.expectedEndDate)}{!closed && <span className={`ms-2 text-xs font-semibold ${days < 0 ? 'text-rose-600' : 'text-slate-400'}`}>({days < 0 ? t('ren.detail.overdue', { n: Math.abs(days) }) : t('ren.detail.daysLeft', { n: days })})</span>}</> },
                  { label: t('ren.detail.duration'), value: t('ren.detail.durationDays', { n: formatNumber(duration) }) },
                  { label: t('common.updatedAt'), value: formatDateTime(project.updatedAt) },
                  { label: t('ren.form.description'), value: project.description || t('common.notProvided'), full: true },
                  ...(project.notes ? [{ label: t('ren.form.notes'), value: project.notes, full: true }] : []),
                ]} />
              </CardBody>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader title={t('ren.detail.status')} icon={UserCog} />
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between"><ProjectStatusBadge status={project.status} /><span className="text-xs text-slate-400">{formatDate(project.statusHistory[0]?.at ?? project.updatedAt)}</span></div>
                <Can permission="renovation.manage" fallback={null}>
                  {project.allowedStatuses.length === 0 ? <p className="text-sm text-slate-500">{t('ren.detail.noTransitions')}</p> : (
                    <div className="flex flex-wrap gap-2">
                      {project.allowedStatuses.map((s) => (
                        <Button key={s} size="sm" variant={s === 'cancelled' ? 'danger' : s === 'completed' ? 'success' : s === 'paused' ? 'warning' : 'primary'} onClick={() => setTarget(s)}>{t(`ren.status.${s}`)}</Button>
                      ))}
                    </div>
                  )}
                </Can>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t('ren.detail.statusHistory')} icon={History} />
              <div className="p-5">
                <Timeline items={project.statusHistory.map((h) => ({ id: h.id, title: <ProjectStatusBadge status={h.to} />, time: formatDateTime(h.at), meta: <>{h.by}{h.from && <> · {t('ren.status.previous', { status: t(`ren.status.${h.from}`) })}</>}</>, body: h.comment, tone: ({ blue: 'blue', amber: 'amber', orange: 'amber', green: 'green', red: 'red' } as const)[projectTone[h.to] as 'blue'] ?? 'slate' }))} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'contractor' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader title={t('ren.contractor.current')} icon={Building2} />
            <CardBody>
              {project.contractor ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><Avatar name={project.contractor.companyName} size="lg" /><div className="min-w-0"><p className="truncate font-bold text-navy-900">{project.contractor.companyName}</p><p className="text-sm text-slate-500">{project.contractor.activity}</p></div></div>
                  <ContractorStatusBadge status={project.contractor.status} />
                  <DescriptionList columns={1} items={[{ label: t('ren.ctr.contact'), value: project.contractor.contactPerson }, { label: t('common.email'), value: <span className="ltr-text">{project.contractor.email}</span> }, { label: t('common.phone'), value: <span className="ltr-text">{project.contractor.phone}</span> }]} />
                  <Link to={`/renovation/contractors/${project.contractor.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">{t('ren.contractor.openProfile')} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
                </div>
              ) : <EmptyState compact title={t('ren.contractor.none')} description=" " />}
              <Can permission="renovation.manage">
                <div className="mt-4">
                  {closed ? <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{t('ren.contractor.projectClosed')}</p> : <Button className="w-full" icon={<UserCog className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>{project.contractor ? t('ren.contractor.reassign') : t('ren.contractor.assign')}</Button>}
                </div>
              </Can>
            </CardBody>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title={t('ren.contractor.history')} icon={History} />
            <div className="p-5">
              {!assignments.data?.length ? <EmptyState compact title={t('ren.contractor.none')} description=" " /> : (
                <Timeline items={assignments.data.map((a) => ({ id: a.id, title: <Link className="hover:text-brand-700 hover:underline" to={`/renovation/contractors/${a.contractorId}`}>{a.contractorName}</Link>, time: `${formatDate(a.assignedAt)} → ${a.endedAt ? formatDate(a.endedAt) : t('ren.asg.current')}`, meta: `${t('ren.contractor.assignedBy')} ${a.assignedBy}`, body: a.note, tone: a.current ? 'green' : 'slate' }))} />
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'progress' && (
        <Card>
          <CardHeader title={t('ren.progress.timeline')} icon={Activity} action={<Can permission="renovation.manage">{!closed && <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setProgressOpen(true)}>{t('ren.progress.add')}</Button>}</Can>} />
          <div className="p-5">
            {closed && <p className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{t('ren.progress.closed')}</p>}
            {!progress.data?.length ? <EmptyState compact title={t('ren.progress.empty')} description=" " /> : (
              <Timeline items={progress.data.map((u) => ({
                id: u.id,
                title: <span>{u.progress}%{u.previousProgress !== null && <span className="ms-1 text-xs font-normal text-slate-400">({t('ren.progress.from', { from: u.previousProgress })})</span>}</span>,
                time: formatDate(u.updateDate),
                meta: <span className="inline-flex flex-wrap items-center gap-2"><PhaseBadge phase={u.phase} /><ProjectStatusBadge status={u.status} /><span>{u.author.name}</span></span>,
                body: u.note, tone: 'blue' as const,
              }))} />
            )}
          </div>
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHeader title={t('ren.docs.title')} icon={FileText} action={<Can permission="renovation.manage"><Button size="sm" icon={<UploadCloud className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>{t('ren.docs.upload')}</Button></Can>} />
          <div className="px-5 py-2"><DocumentsList docs={docs.data} loading={docs.loading} onChanged={refreshAll} /></div>
        </Card>
      )}

      <StatusDialog project={project} target={target} onClose={() => setTarget(null)} onDone={(p: ProjectDetail) => { setData(p); refreshAll(); }} />
      <AssignDialog open={assignOpen} project={project} onClose={() => setAssignOpen(false)} onDone={refreshAll} />
      <ProgressFormDialog open={progressOpen} project={project} onClose={() => setProgressOpen(false)} onDone={refreshAll} />
      <UploadDialog open={uploadOpen} projectId={project.id} onClose={() => setUploadOpen(false)} onDone={refreshAll} />
    </>
  );
}
