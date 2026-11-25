import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { BadgeCheck, BarChart3, GraduationCap, Layers, PencilLine, Search, Users, BookOpenCheck, Network } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { recordsService } from '@/services/records.service';
import { CHART_COLORS, Card, CardHeader, ChartCard, ChartTooltip, DataTable, DonutChart, ErrorState, PageHeader, PageSkeleton, StatCard, chartAxis, chartGrid, type Column } from '@/components/ui';
import { EnrollmentStatusBadge, LevelBadge } from '../components/Badges';
import { StudentCell } from '@/modules/admissions/components/Badges';
import type { StudentListItem } from '../types';

const statusColor = { enrolled: '#2563eb', graduated: '#7c3aed', suspended: '#f59e0b', withdrawn: '#94a3b8' } as const;

export default function RecordsDashboard() {
  const { t, loc, formatNumber, formatDate } = useI18n();
  const navigate = useNavigate();
  const { data, error, reload } = useAsync(() => recordsService.dashboard(), []);
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  const tt = data.totals;

  const cols: Column<StudentListItem>[] = [
    { key: 'student', header: t('rec.col.student'), cell: (s) => <StudentCell name={s.name} studentId={s.studentId} /> },
    { key: 'program', header: t('rec.col.program'), className: 'hidden md:table-cell', cell: (s) => <span className="flex items-center gap-2"><LevelBadge level={s.level} />{loc(s.specialty, s.specialtyAr)}</span> },
    { key: 'status', header: t('rec.col.status'), cell: (s) => <EnrollmentStatusBadge status={s.enrollmentStatus} /> },
    { key: 'updated', header: t('rec.col.updated'), className: 'hidden sm:table-cell', cell: (s) => formatDate(s.updatedAt) },
  ];

  return (
    <>
      <PageHeader title={t('rec.dashboard.title')} subtitle={t('rec.dashboard.subtitle')} breadcrumbs={[{ label: t('rec.title') }]}
        actions={<><Link to="/records/structure" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Network className="h-4 w-4" />{t('rec.quick.structure')}</Link><Link to="/records/students" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700"><Search className="h-4 w-4" />{t('rec.quick.search')}</Link></>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} tone="blue" label={t('rec.stat.students')} value={formatNumber(tt.students)} to="/records/students" />
        <StatCard icon={BadgeCheck} tone="green" label={t('rec.stat.enrolled')} value={formatNumber(tt.enrolled)} to="/records/students?enrollmentStatus=enrolled" />
        <StatCard icon={GraduationCap} tone="purple" label={t('rec.stat.graduated')} value={formatNumber(tt.graduated)} to="/records/students?enrollmentStatus=graduated" />
        <StatCard icon={PencilLine} tone="orange" label={t('rec.stat.updated')} value={formatNumber(tt.recordsUpdated30d)} to="/records/files" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard title={t('rec.chart.byYear')} icon={BarChart3} className="xl:col-span-2">
          <LineChart data={data.byYear} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid {...chartGrid} /><XAxis dataKey="academicYear" {...chartAxis} /><YAxis {...chartAxis} allowDecimals={false} /><Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="count" name={t('rec.chart.students')} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#2563eb' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartCard>
        <ChartCard title={t('rec.chart.byStatus')} icon={BadgeCheck}>
          <StatusDonut data={data.byStatus.map((s) => ({ name: t(`rec.enrollment.${s.status}`), value: s.count, color: statusColor[s.status] }))} total={formatNumber(tt.students)} label={t('rec.chart.total')} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard title={t('rec.chart.byLevel')} icon={Layers}>
          <BarChart data={data.byLevel} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid {...chartGrid} /><XAxis dataKey="level" {...chartAxis} /><YAxis {...chartAxis} allowDecimals={false} /><Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" name={t('rec.chart.students')} radius={[6, 6, 0, 0]} maxBarSize={40}>{data.byLevel.map((l, i) => <Cell key={l.level} fill={l.level.startsWith('L') ? '#2563eb' : '#7c3aed'} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title={t('rec.chart.bySpecialty')} icon={Layers} className="xl:col-span-2" height={300}>
          <BarChart layout="vertical" data={data.bySpecialty.map((s) => ({ ...s, label: loc(s.name, s.nameAr) }))} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid {...chartGrid} horizontal={false} vertical />
            <XAxis type="number" {...chartAxis} allowDecimals={false} /><YAxis type="category" dataKey="label" width={170} {...chartAxis} tick={{ fontSize: 11, fill: '#475569' }} /><Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" name={t('rec.chart.students')} fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={16} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={t('rec.recentlyUpdated')} icon={PencilLine} action={<Link to="/records/files" className="text-sm font-semibold text-brand-600 hover:underline">{t('action.viewAll')} →</Link>} />
          <div className="p-3"><DataTable className="border-0 shadow-none" columns={cols} rows={data.recentlyUpdated} rowKey={(s) => s.id} onRowClick={(s) => navigate(`/records/students/${s.id}`)} minWidth={460} /></div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title={t('rec.chart.byProgram')} icon={BookOpenCheck} />
          <ul className="space-y-3 p-5">
            {data.byProgram.map((p, i) => {
              const max = data.byProgram[0]?.count || 1;
              return (
                <li key={p.programId}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><LevelBadge level={p.level} /><span className="truncate font-medium text-slate-700">{loc(p.name, p.nameAr)}</span></span><span className="font-bold text-slate-800">{p.count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(p.count / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} /></div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}

/** Donut with centre label – rendered inside <ChartCard> (which supplies the ResponsiveContainer). */
function StatusDonut({ data, total, label }: { data: { name: string; value: number; color: string }[]; total: string; label: string }) {
  return (
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none" cy="45%">
        {data.map((d) => <Cell key={d.name} fill={d.color} />)}
      </Pie>
      <Tooltip content={<ChartTooltip />} />
      <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      <text x="50%" y="42%" textAnchor="middle" className="fill-navy-900 text-2xl font-extrabold">{total}</text>
      <text x="50%" y="42%" dy={20} textAnchor="middle" className="fill-slate-500 text-xs">{label}</text>
    </PieChart>
  );
}
