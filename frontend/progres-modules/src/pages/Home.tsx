import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardList, GraduationCap, HardHat, Building2 } from 'lucide-react';
import { Line, LineChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { admissionsService } from '@/services/admissions.service';
import { recordsService } from '@/services/records.service';
import { renovationService } from '@/services/renovation.service';
import { Card, CardHeader, ChartCard, ChartTooltip, DataTable, DonutChart, EmptyState, ProgressBar, StatCard, chartAxis, chartGrid, type Column } from '@/components/ui';
import { ApplicationStatusBadge, StudentCell } from '@/modules/admissions/components/Badges';
import { ProjectStatusBadge } from '@/modules/renovation/components/Badges';
import { ProjectCell } from '@/modules/renovation/components/ProjectCell';
import type { ApplicationListItem } from '@/modules/admissions/types';
import type { ProjectListItem } from '@/modules/renovation/types';

export default function Home() {
  const { t, loc, formatDate, formatNumber, lang } = useI18n();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const canAdm = can('admissions.view'), canRec = can('records.view'), canRen = can('renovation.view');
  const adm = useAsync(() => admissionsService.dashboard(), [canAdm], { enabled: canAdm });
  const rec = useAsync(() => recordsService.dashboard(), [canRec], { enabled: canRec });
  const ren = useAsync(() => renovationService.dashboard(), [canRen], { enabled: canRen });
  const today = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const levels = adm.data?.byLevel ?? [];
  const lic = levels.filter((l) => l.level.startsWith('L')).reduce((a, l) => a + l.count, 0);
  const mas = levels.filter((l) => l.level.startsWith('M')).reduce((a, l) => a + l.count, 0);
  const totalLvl = lic + mas;
  const cycles = [{ name: t('rec.cycle.licence'), value: lic, color: '#2563eb' }, { name: t('rec.cycle.master'), value: mas, color: '#7c3aed' }];

  const appCols: Column<ApplicationListItem>[] = [
    { key: 's', header: t('adm.col.student'), cell: (a) => <StudentCell name={a.studentName} studentId={a.studentId} /> },
    { key: 'p', header: t('adm.col.program'), className: 'hidden md:table-cell', cell: (a) => <span className="block max-w-[200px] truncate">{loc(a.programName, a.programNameAr)}</span> },
    { key: 'd', header: t('common.date'), className: 'hidden min-[1800px]:table-cell', cell: (a) => formatDate(a.submittedAt) },
    { key: 'st', header: t('common.status'), cell: (a) => <ApplicationStatusBadge status={a.status} /> },
  ];
  const projCols: Column<ProjectListItem>[] = [
    { key: 'p', header: t('ren.col.project'), cell: (p) => <ProjectCell p={p} /> },
    { key: 'pr', header: t('ren.col.progress'), className: 'hidden sm:table-cell w-40', cell: (p) => <ProgressBar value={p.progress} /> },
    { key: 'st', header: t('ren.col.status'), cell: (p) => <ProjectStatusBadge status={p.status} /> },
  ];
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-navy-900">{t('home.welcome', { name: user.name })} 👋</h1>
          <p className="mt-1 text-slate-500">{t('home.subtitle')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-card"><CalendarDays className="h-4 w-4 text-brand-600" />{today}</span>
      </div>
      {!canAdm && !canRec && !canRen && <EmptyState title={t('home.noAccess')} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canAdm && <StatCard icon={ClipboardList} tone="blue" label={t('home.apps')} value={adm.data ? formatNumber(adm.data.totals.total) : ''} loading={!adm.data} to="/admissions" />}
        {canRec && <StatCard icon={GraduationCap} tone="green" label={t('home.students')} value={rec.data ? formatNumber(rec.data.totals.students) : ''} loading={!rec.data} to="/records" />}
        {canRen && <StatCard icon={HardHat} tone="orange" label={t('home.projects')} value={ren.data ? formatNumber(ren.data.totals.projects) : ''} loading={!ren.data} to="/renovation/projects" />}
        {canRen && <StatCard icon={Building2} tone="purple" label={t('home.contractors')} value={ren.data ? formatNumber(ren.data.totals.contractors) : ''} loading={!ren.data} to="/renovation/contractors" />}
      </div>
      {canAdm && (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <ChartCard className="xl:col-span-2" title={t('home.trend')} subtitle={t('home.trendSub')} icon={ClipboardList}>
            <LineChart data={(adm.data?.trend ?? []).map((m) => ({ ...m, label: t(`month.${m.month}`) }))} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid {...chartGrid} /><XAxis dataKey="label" {...chartAxis} /><YAxis {...chartAxis} allowDecimals={false} /><Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
              <Line type="monotone" dataKey="submitted" name={t('home.submitted')} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#2563eb' }} />
              <Line type="monotone" dataKey="accepted" name={t('home.accepted')} stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} />
            </LineChart>
          </ChartCard>
          <Card>
            <CardHeader title={t('home.byLevel')} subtitle={t('common.thisYear')} icon={GraduationCap} />
            <div className="flex flex-wrap items-center justify-center gap-4 p-5">
              <div className="w-[200px]"><DonutChart legend={false} height={200} centerValue={formatNumber(totalLvl)} centerLabel={t('home.apps')} data={cycles} /></div>
              <ul className="space-y-3 text-sm">
                {cycles.map((c) => (
                  <li key={c.name} className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ background: c.color }} /><span className="w-20 font-medium text-slate-700">{c.name}</span><span className="font-semibold text-slate-600">{totalLvl ? formatNumber(Math.round((c.value / totalLvl) * 1000) / 10) : 0}%</span></li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {canAdm && (
          <Card>
            <CardHeader title={t('home.recentApps')} icon={ClipboardList} action={<Link to="/admissions/applications" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
            <div className="p-3"><DataTable className="border-0 shadow-none" columns={appCols} rows={adm.data?.recentApplications.slice(0, 5)} loading={!adm.data} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/admissions/applications/${a.id}`)} minWidth={420} /></div>
          </Card>
        )}
        {canRen && (
          <Card>
            <CardHeader title={t('home.recentProjects')} icon={HardHat} action={<Link to="/renovation/projects" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
            <div className="p-3"><DataTable className="border-0 shadow-none" columns={projCols} rows={ren.data?.recentProjects.slice(0, 5)} loading={!ren.data} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/renovation/projects/${p.id}`)} minWidth={420} /></div>
          </Card>
        )}
      </div>
    </>
  );
}
