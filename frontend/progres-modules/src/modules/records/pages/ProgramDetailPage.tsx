import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { History, Info, Lock, Settings2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { recordsService } from '@/services/records.service';
import { cn } from '@/lib/utils';
import { Badge, Card, CardBody, CardHeader, DescriptionList, ErrorState, PageHeader, PageSkeleton } from '@/components/ui';
import { LevelBadge, UETypeBadge, VersionBadge } from '../components/Badges';

export default function ProgramDetailPage() {
  const { id = '' } = useParams();
  const { t, loc, formatNumber } = useI18n();
  const { can } = useAuth();
  const [versionId, setVersionId] = useState<string | undefined>();
  const { data, error, reload } = useAsync(() => recordsService.programs.structure(id, versionId), [id, versionId]);
  const crumbs = [{ label: t('rec.title'), to: '/records' }, { label: t('rec.structure.title'), to: '/records/structure' }, { label: t('rec.tab.programs'), to: '/records/structure/programs' }];

  if (error && !data) return (<><PageHeader title={t('rec.program.title')} breadcrumbs={crumbs} /><ErrorState error={error} onRetry={reload} /></>);
  if (!data) return <PageSkeleton />;
  const { program: p, version, semesters } = data;

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: p.code }]}
        title={loc(p.name, p.nameAr)}
        badge={<LevelBadge level={p.level} />}
        subtitle={`${loc(p.specialtyName, p.specialtyNameAr)} · ${p.fieldName} · ${p.domainName}`}
        actions={can('records.manage') && <Link to="/records/structure/semesters" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Settings2 className="h-4 w-4" />{t('rec.tab.semesters')} / UE / {t('rec.tab.subjects')}</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title={t('rec.program.versions')} icon={History} />
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-500">{t('rec.program.versionsHint')}</p>
            {[...p.versions].reverse().map((v) => {
              const active = v.id === version.id;
              return (
                <button key={v.id} onClick={() => setVersionId(v.id)} aria-pressed={active} className={cn('w-full rounded-xl border-2 p-3.5 text-start transition', active ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300')}>
                  <div className="flex items-center justify-between gap-2"><VersionBadge label={v.label} current={v.isCurrent} />{!v.isCurrent && <Lock className="h-3.5 w-3.5 text-slate-400" />}</div>
                  <p className="mt-2 text-xs text-slate-500">{t('rec.program.period')} : {v.endYear ? t('rec.program.period2', { start: v.startYear, end: v.endYear }) : t('rec.program.periodOpen', { start: v.startYear })}</p>
                </button>
              );
            })}
            <DescriptionList columns={1} className="border-t border-slate-100 pt-4" items={[{ label: t('rec.f.cycle'), value: t(`rec.cycle.${p.cycle}`) }, { label: t('rec.f.totalCredits'), value: p.totalCredits }, { label: t('rec.f.students'), value: t('rec.program.studentsEnrolled', { n: formatNumber(p.studentCount) }) }]} />
          </CardBody>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <div className={cn('flex items-start gap-3 rounded-2xl border p-4 text-sm', version.isCurrent ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-100 text-slate-700')}>
            {version.isCurrent ? <Info className="mt-0.5 h-4 w-4 shrink-0" /> : <Lock className="mt-0.5 h-4 w-4 shrink-0" />}
            <p className="font-medium">{version.isCurrent ? t('rec.program.currentBanner', { label: version.label }) : t('rec.program.historicalBanner', { label: version.label })}</p>
          </div>

          {semesters.length === 0 && <Card><CardBody><p className="py-6 text-center text-sm text-slate-500">{t('rec.program.noSemesters')}</p></CardBody></Card>}
          {semesters.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardHeader title={loc(s.name, s.nameAr)} subtitle={`${t('rec.f.academicYear')} ${s.academicYear}`} action={<div className="flex items-center gap-2"><Badge tone="blue" dot={false}>{t('rec.program.totalCredits', { n: s.credits })}</Badge><Badge tone="slate" dot={false}>{s.ueCount} {t('rec.f.ues')}</Badge></div>} />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead><tr className="border-y border-slate-100 bg-slate-50/80 text-xs text-slate-500">
                    <th className="px-5 py-2.5 text-start font-semibold">{t('rec.f.ue')}</th><th className="px-3 py-2.5 text-start font-semibold">{t('rec.f.ueType')}</th><th className="px-3 py-2.5 text-center font-semibold">{t('rec.f.credits')}</th><th className="px-3 py-2.5 text-center font-semibold">{t('rec.f.coefficient')}</th><th className="px-5 py-2.5 text-start font-semibold">{t('rec.f.hours')}</th>
                  </tr></thead>
                  <tbody>
                    {s.ues.map((u) => (
                      <Fragment key={u.id}>
                        <tr className="border-b border-slate-100 bg-white">
                          <td className="px-5 py-3 font-bold text-slate-800">{loc(u.name, u.nameAr)} <span className="font-mono text-xs font-normal text-slate-400">{u.code}</span></td>
                          <td className="px-3 py-3"><UETypeBadge type={u.type} /></td><td className="px-3 py-3 text-center font-semibold">{u.credits}</td><td className="px-3 py-3 text-center">{u.coefficient}</td><td />
                        </tr>
                        {u.subjects.map((sub) => (
                          <tr key={sub.id} className="border-b border-slate-50 text-slate-600">
                            <td className="py-2 ps-10 pe-3">{loc(sub.name, sub.nameAr)}</td><td />
                            <td />
                            <td className="px-3 py-2 text-center">{sub.coefficient}</td>
                            <td className="px-5 py-2 text-xs">{t('rec.res.hours', { c: sub.lectureHours, td: sub.tdHours, tp: sub.tpHours })}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
