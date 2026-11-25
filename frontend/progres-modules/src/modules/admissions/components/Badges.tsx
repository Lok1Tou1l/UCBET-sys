import { useI18n } from '@/i18n';
import { Avatar, Badge, ProgressBar } from '@/components/ui';
import type { ApplicationStatus, DecisionKind, DocCompletion, DocumentStatus, EnrollmentStatus } from '../types';
import { applicationStatusKey, applicationStatusTone, decisionKey, decisionTone, documentStatusKey, documentStatusTone, enrollmentKey, enrollmentTone } from '../status';

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useI18n();
  return <Badge tone={applicationStatusTone[status]}>{t(applicationStatusKey(status))}</Badge>;
}
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useI18n();
  return <Badge tone={documentStatusTone[status]}>{t(documentStatusKey(status))}</Badge>;
}
export function DecisionBadge({ decision }: { decision: DecisionKind }) {
  const { t } = useI18n();
  return <Badge tone={decisionTone[decision]}>{t(decisionKey(decision))}</Badge>;
}
export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const { t } = useI18n();
  return <Badge tone={enrollmentTone[status]}>{t(enrollmentKey(status))}</Badge>;
}

export function StudentCell({ name, studentId, sub }: { name: string; studentId?: string; sub?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} size="md" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{name}</p>
        {(studentId || sub) && <p className="truncate text-xs text-slate-500">{sub ?? <span className="ltr-text">{studentId}</span>}</p>}
      </div>
    </div>
  );
}

export function CompletionCell({ completion }: { completion: DocCompletion }) {
  const { t } = useI18n();
  const pct = completion.required ? (completion.verified / completion.required) * 100 : 0;
  const missing = completion.required - completion.uploaded;
  return (
    <div className="min-w-[130px]">
      <ProgressBar value={pct} showLabel={false} tone={pct >= 100 ? 'green' : missing > 0 ? 'amber' : 'blue'} />
      <p className="mt-1 text-xs text-slate-500">{missing > 0 ? <span className="font-semibold text-amber-600">{t('adm.docs.missingSome', { n: missing })}</span> : t('adm.docs.count', { verified: completion.verified, required: completion.required })}</p>
    </div>
  );
}
