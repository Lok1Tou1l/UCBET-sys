import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Building2, CalendarClock, CheckCircle2, FileText, FolderKanban, HardHat, PauseCircle, Plus, Users, Wrench, XCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { renovationService } from '@/services/renovation.service';
import { Card, CardHeader, ChartCard, ChartTooltip, DataTable, DonutChart, ErrorState, PageHeader, PageSkeleton, ProgressBar, StatCard, Timeline, chartAxis, chartGrid, type Column } from '@/components/ui';
import { Can } from '@/auth/RequirePermission';
import { PhaseBadge, ProjectStatusBadge, projectTone } from '../components/Badges';
import { ProjectCell } from '../components/ProjectCell';
import type { ProjectListItem, ProjectStatus } from '../types';

const toneColor: Record<string, string> = { blue: '#2563eb', amber: '#f59e0b', orange: '#f97316', green: '#10b981', red: '#ef4444' };

export default function RenovationDashboard() {
  const { t, formatDate, formatNumber } = useI18n();
  const navigate = useNavigate();
  const { data, error, reload } = useAsync(() => renovationService.dashboard(), []);
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  const s = data.totals;
  const cols: Column<ProjectListItem>[] = [
    { key: 'p', header: t('ren.col.project'), cell: (p) => <ProjectCell p={p} /> },
    { key: 'st', header: t('ren.col.status'), cell: (p) => <ProjectStatusBadge status={p.status} /> },
    { key: 'pr', header: t('ren.col.progress'), className: 'hidden sm:table-cell w-40', cell: (p) => <ProgressBar value={p.progress} /> },
  ];
  const quick = [
    { to: '/renovation/projects', label: t('ren.quick.projects'), icon: FolderKanban },
    { to: '/renovation/contractors', label: t('ren.quick.contractors'), icon: Building2 },
    { to: '/renovation/assignments', label: t('ren.quick.assignments'), icon: Users },
    { to: '/renovation/progress', label: t('ren.quick.progress'), icon: Activity },
    { to: '/renovation/documents', label: t('ren.quick.documents'), icon: FileText },
  ];
  return (
    <>
      <PageHeader title={t('ren.dashboard.title')} subtitle={t('ren.dashboard.subtitle')} breadcrumbs={[{ label: t('ren.title') }]}
        actions={<Can permission="renovation.manage"><Link to="/renovation/projects/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700"><Plus className="h-4 w-4" />{t('ren.projects.new')}</Link></Can>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HardHat} tone="blue" label={t('ren.stat.total')} value={formatNumber(s.projects)} to="/renovation/projects" />
        <StatCard icon={CalendarClock} tone="cyan" label={t('ren.stat.planned')} value={formatNumber(s.planned)} to="/renovation/projects?status=planned" />
        <StatCard icon={Wrench} tone="amber" label={t('ren.stat.active')} value={formatNumber(s.active)} to="/renovation/projects?status=active" hint={`${t('ren.stat.avgProgress')} ${formatNumber(s.averageProgress)}%`} />
        <StatCard icon={PauseCircle} tone="orange" label={t('ren.stat.paused')} value={formatNumber(s.paused)} to="/renovation/projects?status=paused" />
        <StatCard icon={CheckCircle2} tone="green" label={t('ren.stat.completed')} value={formatNumber(s.completed)} to="/renovation/projects?status=completed" />
        <StatCard icon={XCircle} tone="red" label={t('ren.stat.cancelled')} value={formatNumber(s.cancelled)} to="/renovation/projects?status=cancelled" />
        <StatCard icon={Building2} tone="purple" label={t('ren.stat.contractors')} value={formatNumber(s.contractors)} to="/renovation/contractors" />
        <StatCard icon={Users} tone="slate" label={t('ren.stat.activeContractors')} value={formatNumber(s.activeContractors)} to="/renovation/contractors?status=active" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard title={t('ren.chart.byStatus')} icon={FolderKanban}>
          <DonutChart height={250} centerValue={formatNumber(s.projects)} centerLabel={t('ren.stat.total')} data={data.byStatus.map((b) => ({ name: t(`ren.status.${b.status}`), value: b.count, color: toneColor[projectTone[b.status as ProjectStatus]] }))} />
        </ChartCard>
        <ChartCard className="xl:col-span-2" title={t('ren.chart.progress')} icon={Activity}>
          <BarChart data={data.progressByProject.map((p) => ({ ...p, label: p.title.length > 16 ? p.title.slice(0, 15) + '…' : p.title }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="label" {...chartAxis} interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis {...chartAxis} domain={[0, 100]} unit="%" />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="progress" name={t('ren.col.progress')} fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard title={t('ren.chart.updates')} subtitle={t('ren.chart.updatesSub')} icon={Activity}>
          <LineChart data={data.updatesTrend.map((m) => ({ ...m, label: t(`month.${Number(m.month.slice(-2))}`) }))} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="label" {...chartAxis} />
            <YAxis {...chartAxis} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="updates" name={t('ren.chart.updatesSeries')} stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#7c3aed' }} />
          </LineChart>
        </ChartCard>
        <Card className="xl:col-span-2">
          <CardHeader title={t('ren.recentProjects')} icon={HardHat} action={<Link to="/renovation/projects" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
          <div className="p-3"><DataTable className="border-0 shadow-none" columns={cols} rows={data.recentProjects} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/renovation/projects/${p.id}`)} minWidth={420} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title={t('ren.quick.title')} />
          <div className="grid gap-2 p-4">
            {quick.map((q) => (
              <Link key={q.to} to={q.to} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                <q.icon className="h-5 w-5" />{q.label}
              </Link>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title={t('ren.recentUpdates')} icon={Activity} action={<Link to="/renovation/progress" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
          <div className="p-5">
            <Timeline items={data.recentUpdates.map((u) => ({ id: u.id, title: <span>{u.projectTitle} <span className="text-brand-600">· {u.progress}%</span></span>, time: formatDate(u.createdAt), meta: <PhaseBadge phase={u.phase} />, body: u.note, tone: 'blue' as const }))} />
          </div>
        </Card>
      </div>
    </>
  );
}
