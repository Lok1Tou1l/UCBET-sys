import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Button, Modal, SelectField, TextAreaField, TextField, ProgressBar, useToast } from '@/components/ui';
import { renovationService } from '@/services/renovation.service';
import { getErrorMessage, ApiError } from '@/services/http';
import { validate, hasErrors, required, minLen, maxLen, numberBetween, dateNotInFuture } from '@/lib/validation';
import { PROJECT_PHASES, type ProjectDetail, type ProjectListItem, type ProjectStatus } from '../types';

type P = Pick<ProjectListItem, 'id' | 'title' | 'progress' | 'phase' | 'status'>;
const today = () => new Date().toISOString().slice(0, 10);

export function ProgressFormDialog({ open, project, onClose, onDone }: { open: boolean; project: P | ProjectDetail | null; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [v, setV] = useState({ progress: '0', phase: 'preparation', updateDate: today(), note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open && project) { setV({ progress: String(project.progress), phase: project.phase, updateDate: today(), note: '' }); setErrors({}); }
  }, [open, project]);
  if (!project) return null;
  const set = (k: keyof typeof v, val: string) => { setV((s) => ({ ...s, [k]: val })); setErrors((e) => ({ ...e, [k]: '' })); };
  const submit = async () => {
    const errs = validate(v, { progress: [required(), numberBetween(0, 100)], phase: [required()], updateDate: [required(), dateNotInFuture()], note: [required(), minLen(5), maxLen(1000)] }, t);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      await renovationService.addProgress(project.id, { progress: Number(v.progress), phase: v.phase as any, status: project.status as ProjectStatus, updateDate: v.updateDate, note: v.note.trim() });
      toast.success(t('ren.progress.saved'));
      onDone();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.details) setErrors(Object.fromEntries(Object.entries(e.details).map(([k, m]) => [k, String(m)])));
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  const pct = Math.max(0, Math.min(100, Number(v.progress) || 0));
  return (
    <Modal open={open} onClose={onClose} locked={saving} size="md" title={t('ren.progress.formTitle')} description={project.title}
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>{t('action.cancel')}</Button><Button onClick={submit} loading={saving}>{t('action.save')}</Button></>}>
      <div className="space-y-4">
        <div>
          <TextField label={t('ren.progress.percent')} required type="number" min={0} max={100} value={v.progress} onChange={(e) => set('progress', e.target.value)} error={errors.progress} />
          <ProgressBar className="mt-2" value={pct} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t('ren.progress.phase')} required value={v.phase} onChange={(e) => set('phase', e.target.value)} options={PROJECT_PHASES.map((p) => ({ value: p, label: t(`ren.phase.${p}`) }))} error={errors.phase} />
          <TextField label={t('ren.progress.date')} required type="date" max={today()} value={v.updateDate} onChange={(e) => set('updateDate', e.target.value)} error={errors.updateDate} />
        </div>
        <TextAreaField label={t('ren.progress.note')} required rows={4} placeholder={t('ren.progress.notePlaceholder')} value={v.note} onChange={(e) => set('note', e.target.value)} error={errors.note} maxLength={1000} />
      </div>
    </Modal>
  );
}
