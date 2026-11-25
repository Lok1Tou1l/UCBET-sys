import { useRef, useState, type DragEvent } from 'react';
import { Download, File as FileIcon, FileImage, FileText, UploadCloud, X } from 'lucide-react';
import { cn, formatBytes, downloadUrl } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { validateFile, type FileRules } from '@/lib/validation';
import { Button } from './Button';
import { Modal } from './Modal';
import { EmptyState } from './States';

export function fileKind(mime?: string, name?: string): 'pdf' | 'image' | 'other' {
  const ext = (name?.split('.').pop() ?? '').toLowerCase();
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'other';
}

export function FileTypeIcon({ mime, name, className }: { mime?: string; name?: string; className?: string }) {
  const k = fileKind(mime, name);
  const Icon = k === 'pdf' ? FileText : k === 'image' ? FileImage : FileIcon;
  const tone = k === 'pdf' ? 'bg-rose-50 text-rose-600' : k === 'image' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500';
  return (
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone, className)}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

/** Drag & drop + click-to-browse uploader with client-side validation. Calls `onFiles` with valid files only. */
export function FileDropzone({
  onFiles,
  rules,
  multiple = true,
  disabled,
  loading,
  className,
}: {
  onFiles: (files: File[]) => void;
  rules: FileRules;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handle = (list: FileList | File[]) => {
    const files = Array.from(list);
    const ok: File[] = [];
    const errs: string[] = [];
    for (const f of files) {
      const e = validateFile(f, rules, t);
      if (e) errs.push(e);
      else ok.push(f);
    }
    setErrors(errs);
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1));
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!disabled && e.dataTransfer.files.length) handle(e.dataTransfer.files);
  };
  const types = (rules.accept ?? []).map((a) => a.replace('image/*', 'images').replace('application/pdf', 'PDF').replace('.', '').toUpperCase()).join(', ');

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition',
          over ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/40',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <UploadCloud className={cn('mb-2 h-9 w-9', over ? 'text-brand-600' : 'text-slate-400', loading && 'animate-pulse')} />
        <p className="text-sm font-semibold text-slate-700">
          {t('upload.drop')} <span className="font-normal text-slate-400">{t('upload.or')}</span> <span className="text-brand-600 underline">{t('upload.browse')}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">{t('upload.hint', { types: types || '*', n: rules.maxSizeMB ?? 10 })}</p>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={(rules.accept ?? []).join(',')}
          onChange={(e) => {
            if (e.target.files) handle(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1" role="alert">
          {errors.map((e, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs font-medium text-rose-600">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface PreviewableDoc {
  name: string;
  url?: string;
  mimeType?: string;
}

/** Modal preview for PDF and image documents; other types fall back to a download prompt. */
export function DocumentPreview({ doc, onClose }: { doc: PreviewableDoc | null; onClose: () => void }) {
  const { t } = useI18n();
  const kind = doc ? fileKind(doc.mimeType, doc.name) : 'other';
  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      size="xl"
      title={doc?.name}
      bodyClassName="p-0 bg-slate-100"
      footer={
        doc?.url ? (
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => downloadUrl(doc.url!, doc.name)}>
            {t('action.download')}
          </Button>
        ) : undefined
      }
    >
      {doc && doc.url && kind === 'pdf' && <iframe title={doc.name} src={doc.url} className="h-[70vh] w-full bg-white" />}
      {doc && doc.url && kind === 'image' && (
        <div className="flex max-h-[70vh] items-center justify-center overflow-auto p-4">
          <img src={doc.url} alt={doc.name} className="max-h-[66vh] rounded-lg bg-white object-contain shadow" />
        </div>
      )}
      {doc && (!doc.url || kind === 'other') && <EmptyState icon={FileIcon} title={t('upload.previewUnavailable')} description={t('upload.previewUnavailableHint')} />}
    </Modal>
  );
}

export const canPreview = (mime?: string, name?: string) => fileKind(mime, name) !== 'other';
export { formatBytes };
