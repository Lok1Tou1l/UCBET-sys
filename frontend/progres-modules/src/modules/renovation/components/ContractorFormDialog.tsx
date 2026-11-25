import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Button, Modal, SelectField, TextAreaField, TextField, useToast } from '@/components/ui';
import { renovationService } from '@/services/renovation.service';
import { ApiError, getErrorMessage } from '@/services/http';
import { validate, hasErrors, required, email, phone, maxLen } from '@/lib/validation';
import { CONTRACTOR_STATUSES, type Contractor, type ContractorStatus } from '../types';

const empty = { companyName: '', contactPerson: '', email: '', phone: '', address: '', city: '', activity: '', registrationNumber: '', foundedYear: '', website: '', description: '', status: 'active' as ContractorStatus };

export function ContractorFormDialog({ open, contractor, onClose, onSaved }: { open: boolean; contractor?: Contractor | null; onClose: () => void; onSaved: (c: Contractor) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setV(contractor ? { ...empty, ...contractor, foundedYear: contractor.foundedYear ? String(contractor.foundedYear) : '', registrationNumber: contractor.registrationNumber ?? '', website: contractor.website ?? '', description: contractor.description ?? '' } : empty);
  }, [open, contractor]);
  const set = (k: keyof typeof empty, val: string) => { setV((s) => ({ ...s, [k]: val })); setErrors((e) => ({ ...e, [k]: '' })); };
  const submit = async () => {
    const errs = validate(v, { companyName: [required(), maxLen(120)], contactPerson: [required(), maxLen(80)], email: [required(), email()], phone: [required(), phone()], address: [required(), maxLen(200)], activity: [required(), maxLen(80)] }, t);
    const y = Number(v.foundedYear);
    if (v.foundedYear && (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear())) errs.foundedYear = t('validation.range', { min: 1900, max: new Date().getFullYear() });
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      const payload = { ...v, foundedYear: v.foundedYear ? y : null };
      const saved = contractor ? await renovationService.updateContractor(contractor.id, payload) : await renovationService.createContractor(payload);
      toast.success(contractor ? t('ren.ctr.updated') : t('ren.ctr.created'));
      onSaved(saved);
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.details) setErrors(Object.fromEntries(Object.entries(e.details).map(([k, m]) => [k, m === 'required' ? t('validation.required') : String(m)])));
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} locked={saving} size="lg" title={contractor ? t('ren.ctr.edit') : t('ren.ctr.new')}
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>{t('action.cancel')}</Button><Button onClick={submit} loading={saving}>{t('action.save')}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField wrapperClassName="sm:col-span-2" label={t('ren.ctr.company')} required value={v.companyName} onChange={(e) => set('companyName', e.target.value)} error={errors.companyName} />
        <TextField label={t('ren.ctr.contact')} required value={v.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} error={errors.contactPerson} />
        <TextField label={t('ren.ctr.activity')} required value={v.activity} onChange={(e) => set('activity', e.target.value)} error={errors.activity} />
        <TextField label={t('common.email')} required type="email" dir="ltr" value={v.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <TextField label={t('common.phone')} required dir="ltr" value={v.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
        <TextField label={t('common.address')} required value={v.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
        <TextField label={t('ren.ctr.city')} value={v.city} onChange={(e) => set('city', e.target.value)} />
        <TextField label={t('ren.ctr.registration')} dir="ltr" value={v.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} />
        <TextField label={t('ren.ctr.founded')} type="number" value={v.foundedYear} onChange={(e) => set('foundedYear', e.target.value)} error={errors.foundedYear} />
        <TextField label={t('ren.ctr.website')} dir="ltr" value={v.website} onChange={(e) => set('website', e.target.value)} />
        <SelectField label={t('common.status')} value={v.status} onChange={(e) => set('status', e.target.value)} options={CONTRACTOR_STATUSES.map((s) => ({ value: s, label: t(`ren.cstatus.${s}`) }))} hint={t('ren.ctr.statusHint')} />
        <TextAreaField wrapperClassName="sm:col-span-2" label={t('ren.ctr.description')} rows={3} value={v.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />
      </div>
    </Modal>
  );
}
