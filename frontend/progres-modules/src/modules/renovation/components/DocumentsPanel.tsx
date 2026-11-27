import { useState } from 'react';
import { Download, Eye, Trash2, UploadCloud } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button, ConfirmDialog, DocumentPreview, EmptyState, FileDropzone, FileTypeIcon, IconButton, Modal, ProgressBar, SelectField, Skeleton, canPreview, useToast, formatBytes } from '@/components/ui';
import { renovationService } from '@/services/renovation.service';
import { getErrorMessage } from '@/services/http';
import { downloadUrl } from '@/lib/utils';
import { Can } from '@/auth/RequirePermission';
import { CategoryBadge } from './Badges';
import { DOCUMENT_CATEGORIES, type DocumentCategory, type ProjectDocument } from '../types';

export const DOC_RULES = { accept: ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.dwg'], maxSizeMB: 10 };

export function UploadDialog({ open, projectId, onClose, onDone }: { open: boolean; projectId: string; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [category, setCategory] = useState<DocumentCategory>('plan');
  const [files, setFiles] = useState<File[]>([]);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const close = () => { if (!busy) { setFiles([]); setPct(0); onClose(); } };
  const submit = async () => {
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) await renovationService.uploadDocument(projectId, files[i], category, (p) => setPct(Math.round((i * 100 + p) / files.length)));
      toast.success(t('ren.docs.uploaded'));
      setBusy(false); setFiles([]); setPct(0);
      onDone(); onClose();
    } catch (e) {
      setBusy(false);
      toast.error(getErrorMessage(e));
    }
  };
  return (
    <Modal open={open} onClose={close} locked={busy} title={t('ren.docs.uploadTitle')}
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>{t('action.cancel')}</Button><Button icon={<UploadCloud className="h-4 w-4" />} onClick={submit} loading={busy} disabled={!files.length}>{t('action.upload')}</Button></>}>
      <div className="space-y-4">
        <SelectField label={t('ren.docs.category')} value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)} options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: t(`ren.doccat.${c}`) }))} />
        <FileDropzone rules={DOC_RULES} disabled={busy} onFiles={(f) => setFiles((s) => [...s, ...f])} />
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 text-sm">
                <FileTypeIcon mime={f.type} name={f.name} className="h-8 w-8" />
                <span className="min-w-0 flex-1 truncate">{f.name}<span className="ms-2 text-xs text-slate-400">{formatBytes(f.size)}</span></span>
                {!busy && <button className="text-xs text-rose-600 hover:underline" onClick={() => setFiles((s) => s.filter((_, j) => j !== i))}>{t('action.delete')}</button>}
              </li>
            ))}
          </ul>
        )}
        {busy && <div><p className="mb-1 text-xs text-slate-500">{t('ren.docs.uploading')}</p><ProgressBar value={pct} /></div>}
      </div>
    </Modal>
  );
}

export function DocumentsList({ docs, loading, onChanged, showProject }: { docs: ProjectDocument[] | undefined; loading?: boolean; onChanged: () => void; showProject?: boolean }) {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [preview, setPreview] = useState<ProjectDocument | null>(null);
  const [del, setDel] = useState<ProjectDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  if (!docs && loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (!docs?.length) return <EmptyState title={t('ren.docs.empty')} description={t('ren.docs.emptyHint')} />;
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
            <FileTypeIcon mime={d.mimeType} name={d.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-navy-900">{d.name}</p>
              <p className="truncate text-xs text-slate-500">{showProject && <>{d.projectTitle} · </>}{formatBytes(d.size)} · {formatDate(d.uploadedAt)} · {d.uploadedBy}</p>
            </div>
            <CategoryBadge category={d.category} />
            <div className="flex items-center gap-1">
              {canPreview(d.mimeType, d.name) && <IconButton label={t('action.preview')} onClick={() => setPreview(d)}><Eye className="h-4 w-4" /></IconButton>}
              <IconButton label={t('action.download')} onClick={() => downloadUrl(d.url, d.name)}><Download className="h-4 w-4" /></IconButton>
              <Can permission="renovation.manage"><IconButton label={t('action.delete')} className="hover:text-rose-600" onClick={() => setDel(d)}><Trash2 className="h-4 w-4" /></IconButton></Can>
            </div>
          </li>
        ))}
      </ul>
      <DocumentPreview doc={preview} onClose={() => setPreview(null)} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} tone="danger" loading={deleting} title={t('ren.docs.deleteTitle', { name: del?.name ?? '' })} message={t('ren.docs.deleteMsg')} confirmLabel={t('action.delete')}
        onConfirm={async () => {
          if (!del) return;
          setDeleting(true);
          try { await renovationService.deleteDocument(del.id); toast.success(t('ren.docs.deleted')); setDel(null); onChanged(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setDeleting(false); }
        }} />
    </>
  );
}
