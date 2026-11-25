import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Globe, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { renovationService } from '@/services/renovation.service';
import { Avatar, Button, Card, CardBody, CardHeader, DataTable, DescriptionList, ErrorState, NotFound, PageHeader, PageSkeleton, ProgressBar, SelectField, useToast, type Column } from '@/components/ui';
import { getErrorMessage } from '@/services/http';
import { Can } from '@/auth/RequirePermission';
import { isApiNotFound } from '../utils';
import { ContractorStatusBadge, ProjectStatusBadge } from '../components/Badges';
import { ContractorFormDialog } from '../components/ContractorFormDialog';
import { ProjectCell } from '../components/ProjectCell';
import { CONTRACTOR_STATUSES, type ContractorStatus, type ProjectListItem } from '../types';

export default function ContractorProfile() {
  const { id = '' } = useParams();
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: c, error, reload, setData } = useAsync(() => renovationService.getContractor(id), [id]);
  const projects = useAsync(() => renovationService.listProjects({ contractorId: id, pageSize: 50, sort: 'startDate', dir: 'desc' }), [id]);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  if (error && !c) return isApiNotFound(error) ? <NotFound /> : <ErrorState error={error} onRetry={reload} />;
  if (!c) return <PageSkeleton />;
  const changeStatus = async (s: ContractorStatus) => {
    setBusy(true);
    try { setData(await renovationService.updateContractorStatus(c.id, s)); toast.success(t('ren.ctr.statusUpdated')); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const cols: Column<ProjectListItem>[] = [
    { key: 'p', header: t('ren.col.project'), cell: (p) => <ProjectCell p={p} /> },
    { key: 's', header: t('ren.col.status'), cell: (p) => <ProjectStatusBadge status={p.status} /> },
    { key: 'e', header: t('ren.col.end'), className: 'hidden md:table-cell', cell: (p) => formatDate(p.expectedEndDate) },
    { key: 'pr', header: t('ren.col.progress'), className: 'hidden sm:table-cell w-40', cell: (p) => <ProgressBar value={p.progress} /> },
  ];
  return (
    <>
      <PageHeader title={c.companyName} subtitle={c.activity} badge={<ContractorStatusBadge status={c.status} />}
        breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.ctr.title'), to: '/renovation/contractors' }, { label: c.companyName }]}
        actions={<Can permission="renovation.manage"><Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEdit(true)}>{t('action.edit')}</Button></Can>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4"><Avatar name={c.companyName} size="xl" /><div className="min-w-0"><p className="font-bold text-navy-900">{c.contactPerson}</p><p className="text-sm text-slate-500">{t('ren.ctr.contact')}</p></div></div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><a className="ltr-text hover:text-brand-600" href={`mailto:${c.email}`}>{c.email}</a></li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span className="ltr-text">{c.phone}</span></li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{c.address}{c.city && `, ${c.city}`}</li>
                {c.website && <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" /><span className="ltr-text">{c.website}</span></li>}
              </ul>
              <Can permission="renovation.manage">
                <SelectField label={t('common.status')} value={c.status} disabled={busy} onChange={(e) => changeStatus(e.target.value as ContractorStatus)} options={CONTRACTOR_STATUSES.map((s) => ({ value: s, label: t(`ren.cstatus.${s}`) }))} hint={t('ren.ctr.statusHint')} />
              </Can>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('ren.ctr.companyInfo')} />
            <CardBody>
              <DescriptionList columns={1} items={[
                { label: t('ren.ctr.registration'), value: c.registrationNumber ? <span className="ltr-text font-mono">{c.registrationNumber}</span> : t('common.notProvided') },
                { label: t('ren.ctr.founded'), value: c.foundedYear ?? t('common.notProvided') },
                { label: t('ren.ctr.assignedProjects'), value: c.projectCount },
                { label: t('ren.ctr.activeProjects'), value: c.activeProjectCount },
                { label: t('ren.ctr.description'), value: c.description || t('common.notProvided') },
              ]} />
            </CardBody>
          </Card>
        </div>
        <Card className="xl:col-span-2 self-start">
          <CardHeader title={t('ren.ctr.projects')} />
          <div className="p-3"><DataTable className="border-0 shadow-none" columns={cols} rows={projects.data?.items} rowKey={(p) => p.id} loading={projects.loading} emptyTitle={t('ren.ctr.noProjects')} onRowClick={(p) => navigate(`/renovation/projects/${p.id}`)} minWidth={480} /></div>
        </Card>
      </div>
      <ContractorFormDialog open={edit} contractor={c} onClose={() => setEdit(false)} onSaved={(x) => { setData(x); }} />
    </>
  );
}
