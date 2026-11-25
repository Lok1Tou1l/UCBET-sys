import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { Button, Modal, SelectField, TextAreaField, useToast } from '@/components/ui';
import { renovationService } from '@/services/renovation.service';
import { getErrorMessage } from '@/services/http';
import type { ProjectDetail } from '../types';

export function AssignDialog({ open, project, onClose, onDone }: { open: boolean; project: ProjectDetail; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { data: filters } = useAsync(() => renovationService.filters(), []);
  const [contractorId, setContractorId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setContractorId(''); setNote(''); setError(undefined); } }, [open]);
  const options = (filters?.contractors ?? []).filter((c) => c.status === 'active' && c.id !== project.contractorId).map((c) => ({ value: c.id, label: c.name }));
  const submit = async () => {
    if (!contractorId) return setError(t('validation.required'));
    setSaving(true);
    try {
      await renovationService.assign(project.id, contractorId, note.trim() || undefined);
      toast.success(t('ren.contractor.assigned'));
      onDone();
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} locked={saving} title={project.contractor ? t('ren.contractor.reassign') : t('ren.contractor.assign')} description={project.title}
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>{t('action.cancel')}</Button><Button onClick={submit} loading={saving}>{t('action.assign')}</Button></>}>
      <div className="space-y-4">
        {project.contractor && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t('ren.contractor.reassignWarn', { name: project.contractor.companyName })}</p>}
        <SelectField label={t('ren.contractor.select')} required value={contractorId} onChange={(e) => { setContractorId(e.target.value); setError(undefined); }} options={options} placeholder="—" error={error} hint={t('ren.contractor.onlyActive')} />
        <TextAreaField label={t('ren.contractor.note')} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </div>
    </Modal>
  );
}
