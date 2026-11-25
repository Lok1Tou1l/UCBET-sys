import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { renovationService } from '@/services/renovation.service';
import { ApiError, getErrorMessage } from '@/services/http';
import { validate, hasErrors, required, minLen, maxLen, dateOnOrAfter } from '@/lib/validation';
import { Button, Card, CardBody, CardHeader, ErrorState, PageHeader, PageSkeleton, SelectField, TextAreaField, TextField, useToast } from '@/components/ui';
import { PROJECT_STATUSES, type ProjectStatus } from '../types';

const empty = { title: '', description: '', location: '', startDate: '', expectedEndDate: '', contractorId: '', status: 'planned' as ProjectStatus, notes: '' };

export default function ProjectFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: filters } = useAsync(() => renovationService.filters(), []);
  const { data: project, loading, error, reload } = useAsync(() => renovationService.getProject(id!), [id], { enabled: editing });
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (project) setV({ title: project.title, description: project.description ?? '', location: project.location, startDate: project.startDate.slice(0, 10), expectedEndDate: project.expectedEndDate.slice(0, 10), contractorId: project.contractorId ?? '', status: project.status, notes: project.notes ?? '' });
  }, [project]);
  if (editing && error && !project) return <ErrorState error={error} onRetry={reload} />;
  if (editing && (loading || !project)) return <PageSkeleton />;
  const set = (k: keyof typeof empty, val: string) => { setV((s) => ({ ...s, [k]: val })); setErrors((e) => ({ ...e, [k]: '' })); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(v, { title: [required(), minLen(5), maxLen(140)], location: [required(), maxLen(120)], startDate: [required()], expectedEndDate: [required(), dateOnOrAfter('startDate')], description: [maxLen(1000)], notes: [maxLen(1000)] }, t);
    setErrors(errs);
    if (hasErrors(errs)) return toast.error(t('validation.formErrors'));
    setSaving(true);
    try {
      const payload = { ...v, contractorId: v.contractorId || null };
      const saved = editing ? await renovationService.updateProject(id!, payload) : await renovationService.createProject(payload);
      toast.success(editing ? t('ren.form.updated') : t('ren.form.created'));
      navigate(`/renovation/projects/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(Object.fromEntries(Object.entries(err.details).map(([k, m]) => [k, m === 'required' ? t('validation.required') : String(m)])));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const title = editing ? t('ren.form.editTitle') : t('ren.form.createTitle');
  const contractorOptions = (filters?.contractors ?? []).filter((c) => c.status === 'active' || c.id === v.contractorId).map((c) => ({ value: c.id, label: c.status === 'active' ? c.name : `${c.name} (${t('ren.form.contractorInactive')})` }));
  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title={title} subtitle={editing ? project?.title : t('ren.form.createSubtitle')} breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.projects.title'), to: '/renovation/projects' }, { label: title }]} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t('ren.form.section.general')} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <TextField wrapperClassName="sm:col-span-2" label={t('ren.form.title')} required value={v.title} onChange={(e) => set('title', e.target.value)} error={errors.title} maxLength={140} />
            <TextField wrapperClassName="sm:col-span-2" label={t('ren.form.location')} required placeholder={t('ren.form.locationPlaceholder')} value={v.location} onChange={(e) => set('location', e.target.value)} error={errors.location} />
            <TextAreaField wrapperClassName="sm:col-span-2" label={t('ren.form.description')} rows={4} value={v.description} onChange={(e) => set('description', e.target.value)} error={errors.description} maxLength={1000} />
            <TextAreaField wrapperClassName="sm:col-span-2" label={t('ren.form.notes')} hint={t('ren.form.notesHint')} rows={3} value={v.notes} onChange={(e) => set('notes', e.target.value)} error={errors.notes} maxLength={1000} />
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={t('ren.form.section.planning')} />
            <CardBody className="space-y-4">
              <TextField label={t('ren.form.startDate')} required type="date" value={v.startDate} onChange={(e) => set('startDate', e.target.value)} error={errors.startDate} />
              <TextField label={t('ren.form.endDate')} required type="date" min={v.startDate || undefined} value={v.expectedEndDate} onChange={(e) => set('expectedEndDate', e.target.value)} error={errors.expectedEndDate} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('ren.form.section.assignment')} />
            <CardBody className="space-y-4">
              <SelectField label={t('ren.form.contractor')} value={v.contractorId} onChange={(e) => set('contractorId', e.target.value)} options={[{ value: '', label: t('ren.form.noContractor') }, ...contractorOptions]} disabled={editing} hint={editing ? t('ren.contractor.history') + ' → ' + t('ren.detail.tab.contractor') : undefined} />
              {editing ? (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{t('ren.form.statusLocked')}</p>
              ) : (
                <SelectField label={t('ren.form.status')} value={v.status} onChange={(e) => set('status', e.target.value)} options={PROJECT_STATUSES.filter((s) => s === 'planned' || s === 'active').map((s) => ({ value: s, label: t(`ren.status.${s}`) }))} />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      <div className="sticky bottom-0 -mx-4 mt-6 flex justify-end gap-3 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>{t('action.cancel')}</Button>
        <Button type="submit" icon={<Save className="h-4 w-4" />} loading={saving}>{t('action.save')}</Button>
      </div>
    </form>
  );
}
