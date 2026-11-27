import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Eye, FileX, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn, downloadUrl, formatBytes } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/services/http';
import { admissionsService } from '@/services/admissions.service';
import { Button, FileTypeIcon, IconButton, Modal, TextAreaField, canPreview } from '@/components/ui';
import { DocumentStatusBadge } from './Badges';
import type { ApplicationDocument, DocumentStatus } from '../types';

const options: { status: Extract<DocumentStatus, 'valid' | 'invalid' | 'incomplete'>; labelKey: string; icon: typeof CheckCircle2; cls: string }[] = [
  { status: 'valid', labelKey: 'adm.docs.markValid', icon: ShieldCheck, cls: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { status: 'invalid', labelKey: 'adm.docs.markInvalid', icon: ShieldAlert, cls: 'border-rose-300 bg-rose-50 text-rose-800' },
  { status: 'incomplete', labelKey: 'adm.docs.markIncomplete', icon: FileX, cls: 'border-orange-300 bg-orange-50 text-orange-800' },
];

/** Modal used by the registrar to mark a document valid / invalid / incomplete (comment mandatory for the last two). */
export function DocumentReviewDialog({ applicationId, doc, onClose, onUpdated }: { applicationId: string; doc: ApplicationDocument | null; onClose: () => void; onUpdated: (d: ApplicationDocument) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [status, setStatus] = useState<DocumentStatus>('valid');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doc) {
      setStatus(doc.status === 'pending' || doc.status === 'missing' ? 'valid' : doc.status);
      setComment(doc.reviewComment ?? '');
      setError(undefined);
    }
  }, [doc]);

  const needsComment = status === 'invalid' || status === 'incomplete';
  const submit = async () => {
    if (needsComment && comment.trim().length < 5) return setError(comment.trim() ? t('validation.minLen', { n: 5 }) : t('validation.required'));
    if (!doc) return;
    setSaving(true);
    try {
      const updated = await admissionsService.reviewDocument(applicationId, doc.id, status, needsComment ? comment.trim() : undefined);
      onUpdated(updated);
      toast.success(t('adm.docs.reviewed'));
      onClose();
    } catch (e) {
      toast.error(t('toast.error'), getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      locked={saving}
      size="md"
      title={t('adm.docs.reviewTitle')}
      description={doc ? t(`adm.docType.${doc.type}`) : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>{t('action.cancel')}</Button>
          <Button onClick={submit} loading={saving}>{t('action.save')}</Button>
        </>
      }
    >
      <div className="grid gap-2.5 sm:grid-cols-3">
        {options.map((o) => {
          const Icon = o.icon;
          const active = status === o.status;
          return (
            <button key={o.status} type="button" onClick={() => { setStatus(o.status); setError(undefined); }} aria-pressed={active} className={cn('flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center text-xs font-bold transition', active ? o.cls : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
              <Icon className="h-5 w-5" />
              {t(o.labelKey)}
            </button>
          );
        })}
      </div>
      {needsComment && (
        <div className="mt-4">
          <TextAreaField label={t('adm.docs.reviewComment')} required hint={t('adm.docs.reviewCommentHint')} rows={3} value={comment} error={error} onChange={(e) => { setComment(e.target.value); setError(undefined); }} />
        </div>
      )}
    </Modal>
  );
}

export function DocumentRow({ doc, canReview, onPreview, onReview }: { doc: ApplicationDocument; canReview: boolean; onPreview: (d: ApplicationDocument) => void; onReview: (d: ApplicationDocument) => void }) {
  const { t, formatDate } = useI18n();
  const uploaded = !!doc.fileName;
  return (
    <li className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5', !uploaded && 'bg-slate-50/60')}>
      {uploaded ? <FileTypeIcon mime={doc.mimeType ?? undefined} name={doc.fileName ?? undefined} /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-300"><FileX className="h-5 w-5" /></span>}
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-bold text-slate-800">{t(`adm.docType.${doc.type}`)}</p>
        <p className="truncate text-xs text-slate-500">
          {uploaded ? (
            <>
              <span className="ltr-text">{doc.fileName}</span> · {doc.size ? formatBytes(doc.size) : ''} · {formatDate(doc.uploadedAt)}
            </>
          ) : (
            t('adm.docs.notUploaded')
          )}
        </p>
        {doc.reviewComment && doc.status !== 'valid' && <p className="mt-1 text-xs font-medium text-rose-600">“{doc.reviewComment}”</p>}
        {doc.reviewedBy && <p className="mt-0.5 text-[11px] text-slate-400">{t('adm.docs.reviewedBy', { name: doc.reviewedBy })}</p>}
      </div>
      <DocumentStatusBadge status={doc.status} />
      <div className="flex items-center gap-1">
        {uploaded && doc.url && (
          <>
            {canPreview(doc.mimeType ?? undefined, doc.fileName ?? undefined) && (
              <IconButton label={t('action.preview')} onClick={() => onPreview(doc)}>
                <Eye className="h-4 w-4" />
              </IconButton>
            )}
            <IconButton label={t('action.download')} onClick={() => downloadUrl(doc.url!, doc.fileName!)}>
              <Download className="h-4 w-4" />
            </IconButton>
          </>
        )}
        {canReview && uploaded && (
          <Button size="sm" variant="soft" onClick={() => onReview(doc)}>
            {t('adm.docs.review')}
          </Button>
        )}
      </div>
    </li>
  );
}
