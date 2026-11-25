import { useState } from 'react';
import { Download, FileBadge2, UserCheck, Users, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { admissionsService } from '@/services/admissions.service';
import { downloadBlob } from '@/lib/utils';
import { getErrorMessage } from '@/services/http';
import { ACADEMIC_LEVELS } from '@/types/common';
import { Badge, Button, DataTable, FilterBar, FilterSelect, Modal, PageHeader, SearchInput, StatCard, useToast, DescriptionList, type Column } from '@/components/ui';
import { EnrollmentBadge, StudentCell } from '../components/Badges';
import type { EnrollmentStatus, Registration } from '../types';

const ENROLLMENT: EnrollmentStatus[] = ['enrolled', 'pending_payment', 'suspended', 'withdrawn'];

export default function Registrations() {
  const { t, loc, formatDate, formatNumber } = useI18n();
  const toast = useToast();
  const list = useListQuery({ academicYear: '', programId: '', level: '', enrollmentStatus: '' }, { sort: { key: 'registeredAt', dir: 'desc' } });
  const filters = useAsync(() => admissionsService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => admissionsService.listRegistrations(list.params), [list.paramsKey]);
  // headline counts come from the API itself (filter + pageSize=1 → `total`)
  const counts = useAsync(
    () => Promise.all([admissionsService.listRegistrations({ pageSize: 1 }), admissionsService.listRegistrations({ enrollmentStatus: 'enrolled', pageSize: 1 }), admissionsService.listRegistrations({ enrollmentStatus: 'pending_payment', pageSize: 1 })]).then(([all, enrolled, pending]) => ({ all: all.total, enrolled: enrolled.total, pending: pending.total })),
    [],
  );
  const [downloading, setDownloading] = useState<string>();
  const [selected, setSelected] = useState<Registration | null>(null);

  const certificate = async (r: Registration) => {
    setDownloading(r.id);
    try {
      downloadBlob(await admissionsService.downloadCertificate(r.id), `certificat-inscription-${r.studentId}.pdf`);
      toast.success(t('adm.reg.certificateDownloaded'));
    } catch (e) {
      toast.error(t('adm.reg.certificateError'), getErrorMessage(e));
    } finally {
      setDownloading(undefined);
    }
  };

  const CertButton = ({ r }: { r: Registration }) =>
    r.certificateAvailable ? (
      <Button size="sm" variant="soft" loading={downloading === r.id} icon={<Download className="h-3.5 w-3.5" />} onClick={(e) => { e.stopPropagation(); void certificate(r); }}>
        PDF
      </Button>
    ) : (
      <Badge tone="slate" dot={false}>{t('adm.reg.certificateUnavailable')}</Badge>
    );

  const columns: Column<Registration>[] = [
    { key: 'studentName', header: t('adm.col.student'), sortable: true, cell: (r) => <StudentCell name={r.studentName} studentId={r.studentId} /> },
    { key: 'programName', header: t('adm.col.program'), sortable: true, cell: (r) => <div><p className="font-medium">{loc(r.programName, r.programNameAr)}</p><p className="text-xs text-slate-500">{loc(r.specialty, r.specialtyAr)}</p></div> },
    { key: 'level', header: t('adm.col.level'), sortable: true, cell: (r) => <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{r.level}</span> },
    { key: 'academicYear', header: t('adm.col.year'), sortable: true, className: 'hidden lg:table-cell', cell: (r) => <span className="ltr-text">{r.academicYear}</span> },
    { key: 'registeredAt', header: t('adm.reg.col.registeredAt'), sortable: true, className: 'hidden md:table-cell', cell: (r) => formatDate(r.registeredAt) },
    { key: 'enrollmentStatus', header: t('adm.reg.col.enrollment'), sortable: true, cell: (r) => <EnrollmentBadge status={r.enrollmentStatus} /> },
    { key: 'certificate', header: t('adm.reg.col.certificate'), align: 'end', cell: (r) => <CertButton r={r} /> },
  ];

  return (
    <>
      <PageHeader title={t('adm.reg.title')} subtitle={t('adm.reg.subtitle')} breadcrumbs={[{ label: t('adm.title'), to: '/admissions' }, { label: t('adm.reg.title') }]} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} tone="blue" label={t('adm.reg.total')} value={formatNumber(counts.data?.all ?? 0)} loading={!counts.data} />
        <StatCard icon={UserCheck} tone="green" label={t('adm.reg.enrolled')} value={formatNumber(counts.data?.enrolled ?? 0)} loading={!counts.data} />
        <StatCard icon={Wallet} tone="amber" label={t('adm.reg.pending')} value={formatNumber(counts.data?.pending ?? 0)} loading={!counts.data} />
      </div>
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('adm.reg.search')} />
        <FilterSelect value={list.filters.academicYear} onChange={(v) => list.setFilter('academicYear', v)} allLabel={t('adm.queue.allYears')} options={(filters.data?.academicYears ?? []).map((y) => ({ value: y, label: y }))} />
        <FilterSelect value={list.filters.level} onChange={(v) => { list.setFilter('level', v); list.setFilter('programId', ''); }} allLabel={t('adm.queue.allLevels')} options={ACADEMIC_LEVELS.map((l) => ({ value: l, label: l }))} />
        <FilterSelect className="max-w-[230px]" value={list.filters.programId} onChange={(v) => list.setFilter('programId', v)} allLabel={t('adm.queue.allPrograms')} options={(filters.data?.programs ?? []).filter((p) => !list.filters.level || p.level === list.filters.level).map((p) => ({ value: p.id, label: `${loc(p.name, p.nameAr)} (${p.level})` }))} />
        <FilterSelect value={list.filters.enrollmentStatus} onChange={(v) => list.setFilter('enrollmentStatus', v)} allLabel={t('adm.reg.allStatuses')} options={ENROLLMENT.map((s) => ({ value: s, label: t(`adm.enrollment.${s}`) }))} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.items} rowKey={(r) => r.id} loading={loading} error={error} onRetry={reload} sort={list.sort} onSortChange={list.setSort} page={list.page} pageSize={list.pageSize} total={data?.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} onRowClick={setSelected} minWidth={820} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={t('adm.reg.detailTitle')} description={selected?.studentName} footer={selected && <><Button variant="secondary" onClick={() => setSelected(null)}>{t('action.close')}</Button>{selected.certificateAvailable && <Button icon={<FileBadge2 className="h-4 w-4" />} loading={downloading === selected.id} onClick={() => certificate(selected)}>{t('adm.reg.certificate')}</Button>}</>}>
        {selected && (
          <DescriptionList items={[
            { label: t('common.studentId'), value: <span className="ltr-text font-mono">{selected.studentId}</span> },
            { label: t('common.email'), value: <span className="ltr-text">{selected.email}</span> },
            { label: t('common.program'), value: `${loc(selected.programName, selected.programNameAr)} (${selected.level})` },
            { label: t('common.specialty'), value: loc(selected.specialty, selected.specialtyAr) },
            { label: t('common.academicYear'), value: <span className="ltr-text">{selected.academicYear}</span> },
            { label: t('adm.reg.col.registeredAt'), value: formatDate(selected.registeredAt) },
            { label: t('adm.reg.col.enrollment'), value: <EnrollmentBadge status={selected.enrollmentStatus} /> },
            { label: t('adm.reg.col.certificate'), value: selected.certificateAvailable ? t('common.yes') : t('adm.reg.certificateUnavailable') },
          ]} />
        )}
      </Modal>
    </>
  );
}
