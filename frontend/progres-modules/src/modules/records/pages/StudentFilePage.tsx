import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenCheck, GraduationCap, History, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { recordsService } from '@/services/records.service';
import { Avatar, Card, CardBody, CardHeader, DataTable, DescriptionList, ErrorState, PageHeader, PageSkeleton, Tabs, Timeline, type Column } from '@/components/ui';
import { CreditsBar, ResultsView, RulesPanel } from '../components/ResultsView';
import { EnrollmentStatusBadge, LevelBadge, OutcomeBadge, SemesterStatusBadge, VersionBadge } from '../components/Badges';
import type { EnrollmentRecord } from '../types';

type TabId = 'profile' | 'results' | 'history';

export default function StudentFilePage() {
  const { id = '' } = useParams();
  const { t, loc, formatDate, formatDateTime, formatNumber } = useI18n();
  const [tab, setTab] = useState<TabId>('profile');
  const { data: f, error, reload } = useAsync(() => recordsService.getStudentFile(id), [id], { keepPrevious: false });
  const crumbs = [{ label: t('rec.title'), to: '/records' }, { label: t('rec.students.title'), to: '/records/students' }];
  if (error && !f) return (<><PageHeader title={t('rec.file.title')} breadcrumbs={crumbs} /><ErrorState error={error} onRetry={reload} /></>);
  if (!f) return <PageSkeleton />;
  const c = f.current;
  const p = f.profile;

  const enrollCols: Column<EnrollmentRecord>[] = [
    { key: 'year', header: t('rec.col.year'), cell: (e) => <span className="ltr-text font-semibold">{e.academicYear}</span> },
    { key: 'program', header: t('rec.col.program'), cell: (e) => <span className="flex items-center gap-2"><LevelBadge level={e.level} />{loc(e.programName, e.programNameAr)}</span> },
    { key: 'version', header: t('rec.file.programVersion'), className: 'hidden md:table-cell', cell: (e) => <VersionBadge label={e.versionLabel} current={e.isCurrentVersion} /> },
    { key: 'enrolled', header: t('rec.file.enrolledAt'), className: 'hidden lg:table-cell', cell: (e) => formatDate(e.enrolledAt) },
    { key: 'credits', header: t('rec.col.credits'), align: 'center', cell: (e) => `${e.creditsAcquired}/${e.creditsTotal}` },
    { key: 'status', header: t('rec.col.status'), cell: (e) => <EnrollmentStatusBadge status={e.enrollmentStatus} /> },
    { key: 'outcome', header: t('rec.res.yearOutcome'), cell: (e) => <OutcomeBadge outcome={e.outcome} /> },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: c.name }]}
        title={c.name}
        badge={<EnrollmentStatusBadge status={c.enrollmentStatus} />}
        subtitle={<span><span className="ltr-text font-mono">{c.studentId}</span> · {loc(c.programName, c.programNameAr)} ({c.level}) · {c.academicYear}</span>}
        actions={<Link to="/records/students" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('action.back')}</Link>}
      />
      <Tabs className="mb-6" active={tab} onChange={setTab} tabs={[{ id: 'profile', label: t('rec.file.tab.profile'), icon: UserRound }, { id: 'results', label: t('rec.file.tab.results'), icon: BookOpenCheck }, { id: 'history', label: t('rec.file.tab.history'), icon: History, count: f.enrollments.length }]} />

      <div key={tab} className="animate-fade-in">
        {tab === 'profile' && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <Card>
                <CardHeader title={t('rec.file.identity')} icon={UserRound} />
                <CardBody>
                  <div className="mb-5 flex items-center gap-4"><Avatar name={c.name} size="xl" /><div className="min-w-0"><p className="text-lg font-extrabold text-navy-900">{c.name}</p><p className="ltr-text font-mono text-sm text-slate-500">{p.studentId}</p></div></div>
                  <ul className="mb-5 space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><span className="ltr-text truncate">{p.email}</span></li>
                    <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span className="ltr-text">{p.phone}</span></li>
                    <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{p.address}</li>
                  </ul>
                  <DescriptionList columns={1} className="border-t border-slate-100 pt-4" items={[{ label: t('rec.file.sex'), value: p.sex === 'M' ? t('rec.file.sexM') : t('rec.file.sexF') }, { label: t('rec.file.birthDate'), value: formatDate(p.birthDate) }, { label: t('rec.file.birthPlace'), value: p.birthPlace }, { label: t('rec.file.nationality'), value: p.nationality }]} />
                </CardBody>
              </Card>
              <Card className="xl:col-span-2">
                <CardHeader title={t('rec.file.currentSituation')} icon={GraduationCap} />
                <CardBody className="space-y-6">
                  <DescriptionList columns={3} items={[
                    { label: t('rec.file.currentProgram'), value: loc(c.programName, c.programNameAr) },
                    { label: t('common.specialty'), value: loc(c.specialty, c.specialtyAr) },
                    { label: t('rec.file.currentLevel'), value: <LevelBadge level={c.level} /> },
                    { label: t('rec.file.currentYear'), value: <span className="ltr-text">{c.academicYear}</span> },
                    { label: t('rec.file.academicStatus'), value: <EnrollmentStatusBadge status={c.enrollmentStatus} /> },
                    { label: t('rec.file.enrollmentHistory'), value: t('rec.file.yearsCount', { n: f.enrollments.length }) },
                  ]} />
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-bold text-navy-900">{t('rec.file.progression')}</p>
                    <CreditsBar acquired={f.credits.acquired} target={f.credits.target} />
                    <p className="mt-2 text-xs text-slate-500">{t('common.lastUpdate')} : {formatDateTime(f.updatedAt)}</p>
                  </div>
                </CardBody>
              </Card>
            </div>
            <div>
              <h3 className="mb-3 text-base font-bold text-navy-900">{t('rec.file.enrollmentHistory')}</h3>
              <DataTable columns={enrollCols} rows={f.enrollments} rowKey={(e) => e.academicYear} minWidth={780} />
            </div>
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5 md:col-span-2"><CreditsBar acquired={f.credits.acquired} target={f.credits.target} /></Card>
              <Card className="p-5"><p className="text-sm text-slate-500">{t('rec.file.currentYear')}</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{formatNumber(f.credits.currentYearAcquired)} <span className="text-sm font-semibold text-slate-400">{t('rec.file.creditsAcquired').toLowerCase()}</span></p></Card>
            </div>
            <RulesPanel rules={f.rules} />
            <ResultsView results={f.results} />
          </div>
        )}

        {tab === 'history' && (
          <Card>
            <CardHeader title={t('rec.file.history.title')} icon={History} subtitle={t('rec.file.history.hint')} />
            <CardBody>
              <Timeline items={f.results.map((y) => ({
                id: y.academicYear,
                title: <span className="flex flex-wrap items-center gap-2"><span className="ltr-text">{y.academicYear}</span><LevelBadge level={y.level} />{loc(y.programName, y.programNameAr)}</span>,
                time: <OutcomeBadge outcome={y.outcome} />,
                meta: <VersionBadge label={y.versionLabel} current={y.isCurrentVersion} />,
                tone: y.outcome === 'repeated' ? 'amber' : y.outcome === 'in_progress' ? 'blue' : y.outcome === 'withdrawn' ? 'slate' : 'green',
                body: (
                  <ul className="space-y-1.5">
                    {y.semesters.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold text-slate-700">{loc(s.name, s.nameAr)}</span><span className="flex items-center gap-3"><span className="text-slate-500">{s.average === null ? '—' : formatNumber(s.average, { minimumFractionDigits: 2 })}</span><span className="text-xs font-semibold text-slate-500">{s.creditsAcquired}/{s.creditsTotal}</span><SemesterStatusBadge status={s.status} /></span></li>)}
                  </ul>
                ),
              }))} />
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
