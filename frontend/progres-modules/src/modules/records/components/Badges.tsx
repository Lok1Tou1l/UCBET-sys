import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui';
import type { Tone } from '@/types/common';
import type { EnrollmentStatus, SemesterResultStatus, UEType, YearOutcome } from '../types';

const enrollmentTone: Record<EnrollmentStatus, Tone> = { enrolled: 'green', graduated: 'purple', suspended: 'amber', withdrawn: 'slate' };
const outcomeTone: Record<YearOutcome, Tone> = { passed: 'green', repeated: 'amber', in_progress: 'blue', graduated: 'purple', withdrawn: 'slate' };
const semTone: Record<SemesterResultStatus, Tone> = { validated: 'green', compensated: 'cyan', not_validated: 'red', in_progress: 'blue' };
const ueTone: Record<UEType, Tone> = { fundamental: 'blue', methodological: 'purple', discovery: 'orange', transversal: 'cyan' };

export const EnrollmentStatusBadge = ({ status }: { status: EnrollmentStatus }) => {
  const { t } = useI18n();
  return <Badge tone={enrollmentTone[status]}>{t(`rec.enrollment.${status}`)}</Badge>;
};
export const OutcomeBadge = ({ outcome }: { outcome: YearOutcome }) => {
  const { t } = useI18n();
  return <Badge tone={outcomeTone[outcome]}>{t(`rec.outcome.${outcome}`)}</Badge>;
};
export const SemesterStatusBadge = ({ status }: { status: SemesterResultStatus }) => {
  const { t } = useI18n();
  return <Badge tone={semTone[status]}>{t(`rec.semStatus.${status}`)}</Badge>;
};
export const UETypeBadge = ({ type }: { type: UEType }) => {
  const { t } = useI18n();
  return <Badge tone={ueTone[type]} dot={false}>{t(`rec.ueType.${type}`)}</Badge>;
};
export const LevelBadge = ({ level }: { level: string }) => (
  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${level.startsWith('M') ? 'bg-violet-50 text-violet-700' : 'bg-brand-50 text-brand-700'}`}>{level}</span>
);
export const VersionBadge = ({ label, current }: { label: string; current: boolean }) => {
  const { t } = useI18n();
  return (
    <Badge tone={current ? 'green' : 'slate'} dot={false}>
      {label} · {current ? t('common.current') : t('common.historical')}
    </Badge>
  );
};
