import { useState, type ReactNode } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { ApiError, getErrorMessage } from '@/services/http';
import { hasErrors, validate, type Rule } from '@/lib/validation';
import type { ListParams, Option, Paginated } from '@/types/common';
import { Button, ConfirmDialog, DataTable, FilterBar, FilterSelect, IconButton, Modal, SearchInput, SelectField, TextAreaField, TextField, useToast, type Column } from '@/components/ui';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'select';
  required?: boolean;
  options?: Option[];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  full?: boolean;
  step?: number;
  dir?: 'ltr' | 'rtl';
}

export interface FilterDef {
  key: string;
  allLabel: string;
  options: Option[];
}

export interface EntityTableProps<T extends { id: string }, V extends Record<string, any>> {
  fetcher: (p: ListParams) => Promise<Paginated<T>>;
  columns: Column<T>[];
  rowName: (row: T) => string;
  filters?: FilterDef[];
  initialFilters?: Record<string, string>;
  searchPlaceholder: string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  canManage: boolean;
  /** form + CRUD */
  createLabel: string;
  editTitle: string;
  fields: (values: V, editing?: T) => FieldDef[];
  initialValues: (row?: T) => V;
  rules: Partial<Record<keyof V & string, Rule<V>[]>>;
  onCreate: (v: V) => Promise<unknown>;
  onUpdate: (row: T, v: V) => Promise<unknown>;
  onDelete: (row: T) => Promise<unknown>;
  /** hide edit / delete for some rows (e.g. historical program versions) */
  rowLocked?: (row: T) => boolean;
  renderDetails?: (row: T) => ReactNode;
  detailsTitle?: (row: T) => string;
  formNote?: ReactNode;
  extraToolbar?: ReactNode;
  /** bump to reload from outside */
  reloadKey?: number;
  formSize?: 'sm' | 'md' | 'lg';
}

export function EntityTable<T extends { id: string }, V extends Record<string, any>>(props: EntityTableProps<T, V>) {
  const { t } = useI18n();
  const toast = useToast();
  const list = useListQuery(props.initialFilters ?? {}, { sort: props.defaultSort });
  const { data, loading, error, reload } = useAsync(() => props.fetcher(list.params), [list.paramsKey, props.reloadKey]);

  const [editing, setEditing] = useState<T | null | 'new'>(null);
  const [values, setValues] = useState<V>(props.initialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [details, setDetails] = useState<T | null>(null);

  const openForm = (row?: T) => {
    setValues(props.initialValues(row));
    setErrors({});
    setDetails(null);
    setEditing(row ?? 'new');
  };

  const submit = async () => {
    const errs = validate(values, props.rules, t);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      if (editing === 'new') await props.onCreate(values);
      else if (editing) await props.onUpdate(editing, values);
      toast.success(editing === 'new' ? t('toast.created') : t('toast.updated'));
      setEditing(null);
      reload();
    } catch (e) {
      if (e instanceof ApiError && e.details) setErrors(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v === 'duplicate' ? getErrorMessage(e) : v === 'required' ? t('validation.required') : getErrorMessage(e)])));
      toast.error(t('toast.error'), getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await props.onDelete(toDelete);
      toast.success(t('rec.entity.deleted'));
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(t('toast.error'), getErrorMessage(e));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const actionCol: Column<T> = {
    key: '__actions',
    header: '',
    align: 'end',
    width: '120px',
    cell: (row) => (
      <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        {props.renderDetails && <IconButton label={t('action.details')} onClick={() => setDetails(row)}><Eye className="h-4 w-4" /></IconButton>}
        {props.canManage && !props.rowLocked?.(row) && (
          <>
            <IconButton label={t('action.edit')} onClick={() => openForm(row)}><Pencil className="h-4 w-4" /></IconButton>
            <IconButton label={t('action.delete')} className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setToDelete(row)}><Trash2 className="h-4 w-4" /></IconButton>
          </>
        )}
      </div>
    ),
  };

  const fieldList = props.fields(values, editing && editing !== 'new' ? editing : undefined);
  const set = (name: string, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  return (
    <>
      <FilterBar onReset={list.reset} activeCount={list.activeFilterCount}>
        <SearchInput className="w-full sm:w-64" value={list.search} onChange={list.setSearch} placeholder={props.searchPlaceholder} />
        {props.filters?.map((f) => (
          <FilterSelect key={f.key} value={list.filters[f.key] ?? ''} onChange={(v) => list.setFilter(f.key, v)} allLabel={f.allLabel} options={f.options} className="max-w-[220px]" />
        ))}
        <div className="ms-auto flex items-center gap-2">
          {props.extraToolbar}
          {props.canManage && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
              {props.createLabel}
            </Button>
          )}
        </div>
      </FilterBar>

      <DataTable
        columns={[...props.columns, actionCol]}
        rows={data?.items}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={reload}
        sort={list.sort}
        onSortChange={list.setSort}
        page={list.page}
        pageSize={list.pageSize}
        total={data?.total}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        onRowClick={props.renderDetails ? (r) => setDetails(r) : undefined}
        emptyAction={list.activeFilterCount > 0 ? <Button variant="secondary" size="sm" onClick={list.reset}>{t('action.reset')}</Button> : undefined}
        minWidth={820}
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        locked={saving}
        size="md"
        title={editing === 'new' ? props.createLabel : props.editTitle}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>{t('action.cancel')}</Button>
            <Button onClick={submit} loading={saving}>{t('action.save')}</Button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="grid gap-4 sm:grid-cols-2" noValidate>
          {props.formNote && <div className="sm:col-span-2">{props.formNote}</div>}
          {fieldList.map((f) => {
            const common = { label: f.label, required: f.required, error: errors[f.name] || undefined, hint: f.hint, disabled: f.disabled, wrapperClassName: f.full || f.type === 'textarea' ? 'sm:col-span-2' : undefined };
            const val = String(values[f.name] ?? '');
            if (f.type === 'textarea') return <TextAreaField key={f.name} {...common} rows={3} value={val} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
            if (f.type === 'select') return <SelectField key={f.name} {...common} value={val} placeholder={t('rec.f.select')} options={f.options ?? []} onChange={(e) => set(f.name, e.target.value)} />;
            return <TextField key={f.name} {...common} type={f.type === 'number' ? 'number' : 'text'} step={f.step} dir={f.dir} value={val} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
          })}
          <button type="submit" hidden />
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={deleting} tone="danger" title={t('rec.entity.deleteTitle', { name: toDelete ? props.rowName(toDelete) : '' })} message={t('rec.entity.deleteMsg')} confirmLabel={t('action.delete')} onConfirm={confirmDelete} />

      <Modal
        open={!!details}
        onClose={() => setDetails(null)}
        size="lg"
        title={details ? props.detailsTitle?.(details) ?? props.rowName(details) : ''}
        footer={
          details && (
            <>
              <Button variant="secondary" onClick={() => setDetails(null)}>{t('action.close')}</Button>
              {props.canManage && !props.rowLocked?.(details) && <Button icon={<Pencil className="h-4 w-4" />} onClick={() => openForm(details)}>{t('action.edit')}</Button>}
            </>
          )
        }
      >
        {details && props.renderDetails?.(details)}
      </Modal>
    </>
  );
}
