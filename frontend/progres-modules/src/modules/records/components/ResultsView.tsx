import { Fragment, useEffect, useState } from 'react';
import { Info, Lock, RefreshCw, Scale } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Badge, Card, ProgressBar, SelectField } from '@/components/ui';
import { LevelBadge, OutcomeBadge, SemesterStatusBadge, UETypeBadge, VersionBadge } from './Badges';
import type { ResultRules, SemesterResult, YearResults } from '../types';

export function RulesPanel({ rules }: { rules: ResultRules }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Scale className="h-4 w-4 text-amber-700" />
        <p className="text-sm font-bold text-amber-900">{t('rec.res.rulesTitle')}</p>
        <Badge tone={rules.status === 'provisional' ? 'amber' : 'green'} dot={false}>{rules.status === 'provisional' ? t('rec.res.rulesProvisional') : t('rec.res.rulesOfficial')}</Badge>
      </div>
      <dl className="grid gap-x-6 gap-y-1.5 text-xs text-amber-950 sm:grid-cols-3">
        <div><dt className="font-bold">{t('rec.res.rulesPassMark')}</dt><dd>{rules.passMark} / 20</dd></div>
        <div><dt className="font-bold">{t('rec.res.rulesCompensation')}</dt><dd>{rules.compensation}</dd></div>
        <div><dt className="font-bold">{t('rec.res.rulesResit')}</dt><dd>{rules.resit}</dd></div>
      </dl>
      <p className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-800"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{rules.note ?? t('rec.res.rulesDisclaimer')}</p>
    </div>
  );
}

const markCls = (m: number | null, pass = 10) => (m === null ? 'text-slate-400' : m >= pass ? 'text-emerald-700' : 'text-rose-600');

function SemesterCard({ s }: { s: SemesterResult }) {
  const { t, loc, formatNumber } = useI18n();
  const fmt = (n: number | null) => (n === null ? t('rec.res.noMark') : formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-base font-bold text-navy-900">{loc(s.name, s.nameAr)}</h4>
          <SemesterStatusBadge status={s.status} />
          {s.resit && <Badge tone="orange" dot={false}><RefreshCw className="h-3 w-3" />{t('rec.res.resit')}</Badge>}
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span className="text-slate-500">{t('rec.res.semesterAverage')} : <b className={cn('text-base', markCls(s.average))}>{fmt(s.average)}</b></span>
          <span className="font-semibold text-slate-700">{t('rec.res.creditsOf', { a: s.creditsAcquired, t: s.creditsTotal })}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-xs text-slate-500">
            <th className="px-5 py-2.5 text-start font-semibold">{t('rec.f.ue')} / {t('rec.res.subjects')}</th>
            <th className="px-3 py-2.5 text-center font-semibold">{t('rec.res.coefficient')}</th>
            <th className="px-3 py-2.5 text-center font-semibold">{t('rec.f.credits')}</th>
            <th className="px-3 py-2.5 text-center font-semibold">{t('rec.res.mark')}</th>
            <th className="px-3 py-2.5 text-center font-semibold">{t('rec.res.resitMark')}</th>
            <th className="px-5 py-2.5 text-end font-semibold">{t('rec.res.ueStatus')}</th>
          </tr></thead>
          <tbody>
            {s.ues.map((u) => (
              <Fragment key={u.id}>
                <tr className="border-t border-slate-100 bg-white">
                  <td className="px-5 py-2.5"><span className="font-bold text-slate-800">{loc(u.name, u.nameAr)}</span> <UETypeBadge type={u.type} /></td>
                  <td className="px-3 text-center">{u.coefficient}</td>
                  <td className="px-3 text-center font-semibold">{u.creditsAcquired}/{u.credits}</td>
                  <td className={cn('px-3 text-center font-extrabold', markCls(u.average))}>{fmt(u.average)}</td>
                  <td />
                  <td className="px-5 text-end">
                    {u.validated === null ? <Badge tone="blue">{t('rec.semStatus.in_progress')}</Badge> : u.compensated ? <Badge tone="cyan">{t('rec.res.ueCompensated')}</Badge> : u.validated ? <Badge tone="green">{t('rec.res.ueValidated')}</Badge> : <Badge tone="red">{t('rec.res.ueNotValidated')}</Badge>}
                  </td>
                </tr>
                {u.subjects.map((sub) => (
                  <tr key={sub.id} className="text-slate-600">
                    <td className="py-1.5 ps-10 pe-3">{loc(sub.name, sub.nameAr)}</td>
                    <td className="px-3 text-center">{sub.coefficient}</td><td />
                    <td className={cn('px-3 text-center font-semibold', markCls(sub.mark))}>{fmt(sub.mark)}</td>
                    <td className={cn('px-3 text-center font-semibold', sub.resitMark !== null && markCls(sub.resitMark))}>{sub.resitMark === null ? '' : fmt(sub.resitMark)}</td><td />
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Displays results exactly as returned by the backend – year selector + semester/UE/subject breakdown. */
export function ResultsView({ results, initialYear }: { results: YearResults[]; initialYear?: string }) {
  const { t, loc } = useI18n();
  const [year, setYear] = useState(initialYear ?? results[0]?.academicYear ?? '');
  useEffect(() => { if (!results.find((r) => r.academicYear === year)) setYear(results[0]?.academicYear ?? ''); }, [results, year]);
  const y = results.find((r) => r.academicYear === year);
  if (!y) return <p className="py-10 text-center text-sm text-slate-500">{t('rec.file.noResults')}</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SelectField wrapperClassName="w-56" label={t('rec.file.selectYear')} value={year} onChange={(e) => setYear(e.target.value)} options={results.map((r) => ({ value: r.academicYear, label: `${r.academicYear} · ${r.level}` }))} />
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={y.level} /><span className="text-sm font-semibold text-slate-700">{loc(y.programName, y.programNameAr)}</span>
          <VersionBadge label={y.versionLabel} current={y.isCurrentVersion} /><OutcomeBadge outcome={y.outcome} />
        </div>
      </div>
      {!y.isCurrentVersion && <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-medium text-slate-600"><Lock className="h-3.5 w-3.5" />{t('rec.res.historicalVersion')} — {y.versionLabel}</p>}
      {y.semesters.map((s) => <SemesterCard key={s.id} s={s} />)}
    </div>
  );
}

export function CreditsBar({ acquired, target }: { acquired: number; target: number }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm"><span className="font-semibold text-slate-600">{t('rec.file.creditsAcquired')}</span><span className="font-bold text-navy-900">{t('rec.file.creditsOfCycle', { acquired, target })}</span></div>
      <ProgressBar value={target ? (acquired / target) * 100 : 0} />
    </div>
  );
}
