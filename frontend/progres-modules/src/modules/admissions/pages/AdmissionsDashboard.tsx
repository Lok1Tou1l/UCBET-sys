import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';
import { AlertCircle, CheckCircle2, ClipboardList, Clock, FileSearch, Gavel, Inbox, XCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { admissionsService } from '@/services/admissions.service';
import { Card, CardHeader, ChartCard, ChartTooltip, DataTable, ErrorState, PageHeader, StatCard, chartAxis, chartGrid, EmptyState, Timeline, Skeleton, PageSkeleton } from '@/components/ui';
import { ApplicationStatusBadge, DecisionBadge, StudentCell } from '../components/Badges';
import { decisionTone } from '../status';
import type { Column } from '@/components/ui';
import type { ApplicationListItem } from '../types';

export default function AdmissionsDashboard() {
  const { t, loc, formatDate, formatDateTime, formatNumber } = useI18n();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => admissionsService.dashboard(), []);

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  const s = data.totals;

  const cols: Column<ApplicationListItem>[] = [
    { key: 'student', header: t('adm.col.student'), cell: (a) => <StudentCell name={a.studentName} studentId={a.studentId} /> },
    { key: 'program', header: t('adm.col.program'), className: 'hidden md:table-cell', cell: (a) => <span>{loc(a.programName, a.programNameAr)} <span className="text-xs font-semibold text-slate-400">· {a.level}</span></span> },
    { key: 'date', header: t('common.date'), className: 'hidden sm:table-cell', cell: (a) => formatDate(a.submittedAt) },
    { key: 'status', header: t('common.status'), cell: (a) => <ApplicationStatusBadge status={a.status} /> },
  ];

  return (
    <>
      <PageHeader
        title={t('adm.dashboard.title')}
        subtitle={t('adm.dashboard.subtitle')}
        breadcrumbs={[{ label: t('adm.title') }]}
        actions={
          <Link to="/admissions/applications?status=submitted" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700">
            <Inbox className="h-4 w-4" />
            {t('adm.toReview')} ({formatNumber(s.submitted)})
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={ClipboardList} tone="blue" label={t('adm.stat.total')} value={formatNumber(s.total)} to="/admissions/applications" />
        <StatCard icon={Clock} tone="purple" label={t('adm.stat.submitted')} value={formatNumber(s.submitted)} to="/admissions/applications?status=submitted" />
        <StatCard icon={FileSearch} tone="amber" label={t('adm.stat.underReview')} value={formatNumber(s.underReview)} to="/admissions/applications?status=under_review" />
        <StatCard icon={CheckCircle2} tone="green" label={t('adm.stat.accepted')} value={formatNumber(s.accepted)} to="/admissions/applications?status=accepted" />
        <StatCard icon={XCircle} tone="red" label={t('adm.stat.rejected')} value={formatNumber(s.rejected)} to="/admissions/applications?status=rejected" />
        <StatCard icon={AlertCircle} tone="cyan" label={t('adm.stat.needsCorrection')} value={formatNumber(s.needsCorrection)} to="/admissions/applications?status=needs_correction" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title={t('adm.chart.trend')} subtitle={t('adm.chart.trendSub')} icon={ClipboardList}>
          <LineChart data={data.trend.map((m) => ({ ...m, label: t(`month.${m.month}`) }))} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="label" {...chartAxis} />
            <YAxis {...chartAxis} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
            <Line type="monotone" dataKey="submitted" name={t('adm.chart.submitted')} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#2563eb' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="accepted" name={t('adm.chart.accepted')} stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartCard>
        <ChartCard title={t('adm.chart.byLevel')} subtitle={t('adm.chart.byLevelSub')} icon={Gavel}>
          <BarChart data={data.byLevel} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="level" {...chartAxis} />
            <YAxis {...chartAxis} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" name={t('adm.stat.total')} fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={t('adm.recentApplications')} icon={Inbox} action={<Link to="/admissions/applications" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
          <div className="p-3">
            <DataTable className="border-0 shadow-none" columns={cols} rows={data.recentApplications} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/admissions/applications/${a.id}`)} minWidth={480} />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title={t('adm.recentActions')} icon={Gavel} action={<Link to="/admissions/decisions" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
          <div className="p-5">
            {data.recentActions.length === 0 ? (
              <EmptyState compact title={t('adm.noActions')} description=" " />
            ) : (
              <Timeline
                items={data.recentActions.map((d) => ({
                  id: d.id,
                  title: <span className="flex flex-wrap items-center gap-2"><DecisionBadge decision={d.decision} /><span className="text-slate-700">{d.studentName}</span></span>,
                  time: formatDateTime(d.at),
                  meta: `${t('common.by')} ${d.actor} · ${d.reference}`,
                  tone: ({ green: 'green', red: 'red', blue: 'blue', amber: 'amber' } as const)[decisionTone[d.decision] as 'green'] ?? 'slate',
                }))}
              />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
