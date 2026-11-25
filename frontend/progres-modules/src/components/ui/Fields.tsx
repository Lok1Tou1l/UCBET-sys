import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { Option } from '@/types/common';

/** control look without any width, for compact inline controls (filters, page size) */
export const controlCls =
  'rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
export const inputCls = `block w-full ${controlCls}`;
const errCls = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

interface FieldShellProps {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  /** classes for the outer wrapper (the `className` prop targets the control itself) */
  wrapperClassName?: string;
}

function FieldShell({ id, label, error, hint, required, wrapperClassName, children }: FieldShellProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ms-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldShellProps>(function TextField(
  { label, error, hint, required, className, wrapperClassName, ...rest },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} wrapperClassName={wrapperClassName}>
      <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} required={false} className={cn(inputCls, 'h-10', error && errCls, className)} {...rest} />
    </FieldShell>
  );
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldShellProps>(function TextAreaField(
  { label, error, hint, required, className, wrapperClassName, ...rest },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} wrapperClassName={wrapperClassName}>
      <textarea ref={ref} id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn(inputCls, 'resize-y py-2.5', error && errCls, className)} {...rest} />
    </FieldShell>
  );
});

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldShellProps {
  options: Option[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, required, className, wrapperClassName, options, placeholder, ...rest },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} wrapperClassName={wrapperClassName}>
      <select ref={ref} id={id} aria-invalid={!!error} className={cn(inputCls, 'h-10 pe-8', error && errCls, className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

/** Compact select used in filter bars. `allLabel` adds the "all" option with empty value. */
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  allLabel: string;
  label?: string;
  className?: string;
}) {
  return (
    <select
      aria-label={label ?? allLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlCls, 'h-10 min-w-0 max-w-full pe-8', value && 'border-brand-300 bg-brand-50/40 font-medium', className)}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DateInput({ value, onChange, label, className, min, max }: { value: string; onChange: (v: string) => void; label: string; className?: string; min?: string; max?: string }) {
  return <input type="date" aria-label={label} title={label} value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className={cn(controlCls, 'h-10', value && 'border-brand-300 bg-brand-50/40', className)} />;
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('action.search')}
        aria-label={placeholder ?? t('action.search')}
        className={cn(inputCls, 'h-10 ps-9 pe-8 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button onClick={() => onChange('')} aria-label={t('action.clear')} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
