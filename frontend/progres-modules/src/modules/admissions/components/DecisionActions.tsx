import { useState } from 'react';
import { CheckCircle2, PlayCircle, RotateCcw, XCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/services/http';
import { admissionsService } from '@/services/admissions.service';
import { Button, ConfirmDialog } from '@/components/ui';
import type { ApplicationDetail } from '../types';

type Dialog = 'start' | 'accept' | 'reject' | 'correction' | null;

/**
 * Registrar decision workflow: Start review → Accept / Reject / Request correction.
 * Reject & correction require a comment; every action asks for confirmation and calls the backend.
 */
export function DecisionActions({ application, onChanged, canDecide }: { application: ApplicationDetail; onChanged: (a: ApplicationDetail) => void; canDecide: boolean }) {
  const { t, loc } = useI18n();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<ApplicationDetail>, successKey: string) => {
    setBusy(true);
    try {
      onChanged(await fn());
      toast.success(t(successKey));
      setDialog(null);
    } catch (e) {
      toast.error(t('toast.error'), getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const a = application;
  const unverified = a.documents.filter((d) => d.status !== 'valid').length;

  if (!canDecide) return <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{t('adm.readOnly')}</p>;

  return (
    <>
      {a.status === 'submitted' && (
        <div className="space-y-2">
          <Button className="w-full" icon={<PlayCircle className="h-4 w-4" />} onClick={() => setDialog('start')}>{t('adm.action.startReview')}</Button>
          <p className="text-xs text-slate-500">{t('adm.action.startReviewHint')}</p>
        </div>
      )}
      {a.status === 'under_review' && (
        <div className="grid gap-2">
          <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setDialog('accept')}>{t('adm.action.accept')}</Button>
          <Button variant="warning" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setDialog('correction')}>{t('adm.action.requestCorrection')}</Button>
          <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => setDialog('reject')}>{t('adm.action.reject')}</Button>
        </div>
      )}
      {a.status === 'needs_correction' && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">{t('adm.action.waitingStudent')}</p>}
      {(a.status === 'accepted' || a.status === 'rejected') && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{t('adm.action.finalHint')}</p>}

      <ConfirmDialog open={dialog === 'start'} onClose={() => setDialog(null)} loading={busy} title={t('adm.confirm.startReview')} message={t('adm.confirm.startReviewMsg')} confirmLabel={t('adm.action.startReview')} onConfirm={() => run(() => admissionsService.startReview(a.id), 'adm.toast.reviewStarted')} />

      <ConfirmDialog
        open={dialog === 'accept'}
        onClose={() => setDialog(null)}
        loading={busy}
        tone="success"
        title={t('adm.confirm.acceptTitle')}
        message={t('adm.confirm.acceptMsg', { name: a.studentName, program: `${loc(a.programName, a.programNameAr)} (${a.level})` })}
        confirmLabel={t('adm.action.accept')}
        commentLabel={t('adm.confirm.acceptComment')}
        onConfirm={(c) => run(() => admissionsService.accept(a.id, c), 'adm.toast.accepted')}
      >
        {unverified > 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{t('adm.confirm.acceptWarn', { n: unverified })}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        loading={busy}
        tone="danger"
        title={t('adm.confirm.rejectTitle')}
        message={t('adm.confirm.rejectMsg')}
        confirmLabel={t('adm.action.reject')}
        commentLabel={t('adm.confirm.rejectComment')}
        commentPlaceholder={t('adm.confirm.rejectPlaceholder')}
        commentRequired
        onConfirm={(c) => run(() => admissionsService.reject(a.id, c!), 'adm.toast.rejected')}
      />

      <ConfirmDialog
        open={dialog === 'correction'}
        onClose={() => setDialog(null)}
        loading={busy}
        tone="warning"
        title={t('adm.confirm.correctionTitle')}
        message={t('adm.confirm.correctionMsg')}
        confirmLabel={t('adm.action.requestCorrection')}
        commentLabel={t('adm.confirm.correctionComment')}
        commentPlaceholder={t('adm.confirm.correctionPlaceholder')}
        commentRequired
        onConfirm={(c) => run(() => admissionsService.requestCorrection(a.id, c!, a.documents.filter((d) => ['invalid', 'incomplete', 'missing'].includes(d.status)).map((d) => d.id)), 'adm.toast.correction')}
      />
    </>
  );
}
