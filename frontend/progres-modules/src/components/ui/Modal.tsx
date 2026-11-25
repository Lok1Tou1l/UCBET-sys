import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Button } from './Button';
import { TextAreaField } from './Fields';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(96vw,1200px)]',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: keyof typeof sizes;
  footer?: ReactNode;
  children?: ReactNode;
  /** disable closing via backdrop / Esc (e.g. while submitting) */
  locked?: boolean;
  bodyClassName?: string;
}

export function Modal({ open, onClose, title, description, size = 'md', footer, children, locked, bodyClassName }: ModalProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => panelRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, locked, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/50 backdrop-blur-[2px]" onClick={() => !locked && onClose()} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn('relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-2xl bg-white shadow-pop sm:rounded-2xl', sizes[size])}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-navy-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <button onClick={onClose} disabled={locked} aria-label={t('action.close')} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** receives the trimmed comment when `commentLabel` is set */
  onConfirm: (comment?: string) => void | Promise<void>;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
  loading?: boolean;
  commentLabel?: string;
  commentPlaceholder?: string;
  commentRequired?: boolean;
  minCommentLength?: number;
  /** extra content rendered above the comment box */
  children?: ReactNode;
}

const toneIcon = {
  primary: { Icon: CheckCircle2, cls: 'bg-brand-50 text-brand-600' },
  success: { Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
  danger: { Icon: XCircle, cls: 'bg-rose-50 text-rose-600' },
  warning: { Icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600' },
};

/** Confirmation dialog with an optional (mandatory) comment – used by reject / request-correction / status changes. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  loading,
  commentLabel,
  commentPlaceholder,
  commentRequired,
  minCommentLength = 10,
  children,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | undefined>();
  const { Icon, cls } = toneIcon[tone];

  useEffect(() => {
    if (open) {
      setComment('');
      setError(undefined);
    }
  }, [open]);

  const submit = () => {
    if (commentLabel) {
      const c = comment.trim();
      if (commentRequired && !c) return setError(t('validation.required'));
      if (commentRequired && c.length < minCommentLength) return setError(t('validation.minLen', { n: minCommentLength }));
      void onConfirm(c || undefined);
    } else {
      void onConfirm();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      locked={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('action.cancel')}
          </Button>
          <Button variant={tone === 'primary' ? 'primary' : tone} onClick={submit} loading={loading}>
            {confirmLabel ?? t('action.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', cls)}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-navy-900">{title}</h3>
          {message && <div className="mt-1 text-sm text-slate-600">{message}</div>}
          {children && <div className="mt-3">{children}</div>}
          {commentLabel && (
            <div className="mt-4">
              <TextAreaField
                label={commentLabel}
                required={commentRequired}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setError(undefined);
                }}
                placeholder={commentPlaceholder}
                error={error}
                rows={4}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
