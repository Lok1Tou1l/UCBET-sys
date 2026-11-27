import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { renovationService } from '@/services/renovation.service';
import { Button, Card, ErrorState, FilterBar, FilterSelect, Modal, PageHeader, Pagination, SearchInput, SelectField } from '@/components/ui';
import { Can } from '@/auth/RequirePermission';
import { DocumentsList, UploadDialog } from '../components/DocumentsPanel';
import { DOCUMENT_CATEGORIES } from '../types';

export default function DocumentsPage() {
  const { t } = useI18n();
  const list = useListQuery({ projectId: '', category: '' }, { pageSize: 10 });
  const { data: filters } = useAsync(() => renovationService.filters(), []);
  const { data, loading, error, reload } = useAsync(() => renovationService.listDocuments(list.params), [list.paramsKey], { keepPrevious: true });
  const [pick, setPick] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [upload, setUpload] = useState(false);
  const projects = (filters?.projects ?? []).map((p) => ({ value: p.id, label: p.title }));
  return (
    <>
      <PageHeader title={t('ren.docs.title')} subtitle={t('ren.docs.subtitle')} breadcrumbs={[{ label: t('ren.title'), to: '/renovation' }, { label: t('ren.docs.title') }]}
        actions={<Can permission="renovation.manage"><Button icon={<UploadCloud className="h-4 w-4" />} onClick={() => { setProjectId(list.filters.projectId); list.filters.projectId ? setUpload(true) : setPick(true); }}>{t('ren.docs.upload')}</Button></Can>} />
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={t('ren.docs.search')} />
        <FilterSelect value={list.filters.projectId} onChange={(v) => list.setFilter('projectId', v)} allLabel={t('ren.progress.global.allProjects')} options={projects} />
        <FilterSelect value={list.filters.category} onChange={(v) => list.setFilter('category', v)} allLabel={t('ren.docs.allCategories')} options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: t(`ren.doccat.${c}`) }))} />
      </FilterBar>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <Card>
          <div className="px-5 py-2"><DocumentsList docs={data?.items} loading={loading} onChanged={reload} showProject /></div>
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} />}
        </Card>
      )}
      <Modal open={pick} onClose={() => setPick(false)} size="sm" title={t('ren.docs.selectProjectFirst')}
        footer={<><Button variant="secondary" onClick={() => setPick(false)}>{t('action.cancel')}</Button><Button disabled={!projectId} onClick={() => { setPick(false); setUpload(true); }}>{t('action.confirm')}</Button></>}>
        <SelectField label={t('ren.docs.project')} value={projectId} onChange={(e) => setProjectId(e.target.value)} options={projects} placeholder="—" />
      </Modal>
      {projectId && <UploadDialog open={upload} projectId={projectId} onClose={() => setUpload(false)} onDone={reload} />}
    </>
  );
}
