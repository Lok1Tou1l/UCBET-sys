import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, FolderTree } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { recordsService } from '@/services/records.service';
import { ACADEMIC_LEVELS, type ListParams, type Option } from '@/types/common';
import { maxLen, numberBetween, required } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Badge, Button, DescriptionList, EmptyState, ErrorState, Skeleton, type Column } from '@/components/ui';
import { EntityTable } from './EntityTable';
import { LevelBadge, UETypeBadge, VersionBadge } from './Badges';
import { UE_TYPES, type Domain, type Field, type HierarchyNode, type Program, type Semester, type Specialty, type Subject, type TeachingUnit } from '../types';

const useManage = () => useAuth().can('records.manage');
const byName = (a: Option, b: Option) => a.label.localeCompare(b.label);

/** reusable "children of this entity" list used inside details modals */
function ChildList<T extends { id: string }>({ fetcher, render, empty }: { fetcher: () => Promise<T[]>; render: (row: T) => ReactNode; empty?: string }) {
  const { t } = useI18n();
  const { data, error, reload } = useAsync(fetcher, []);
  if (error) return <ErrorState compact error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-16 w-full" />;
  if (!data.length) return <p className="py-3 text-sm text-slate-500">{empty ?? t('rec.details.noChildren')}</p>;
  return <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">{data.map((d) => <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">{render(d)}</li>)}</ul>;
}
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mt-5"><h4 className="mb-2 text-sm font-bold text-navy-900">{title}</h4>{children}</div>
);

const baseRules = { code: [required(), maxLen(20)], name: [required(), maxLen(120)], nameAr: [maxLen(120)], description: [maxLen(400)] };
const codeName = (t: (k: string) => string, locked = false) => [
  { name: 'code', label: t('rec.f.code'), required: true, disabled: locked },
  { name: 'name', label: t('rec.f.name'), required: true, full: true },
  { name: 'nameAr', label: t('rec.f.nameAr'), dir: 'rtl' as const, full: true },
];

// ------------------------------------------------------------------------------------------------ Domains
export function DomainsTab() {
  const { t, loc } = useI18n();
  const canManage = useManage();
  const columns: Column<Domain>[] = [
    { key: 'code', header: t('rec.f.code'), sortable: true, cell: (d) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">{d.code}</span> },
    { key: 'name', header: t('common.name'), sortable: true, cell: (d) => <span className="font-semibold text-slate-800">{loc(d.name, d.nameAr)}</span> },
    { key: 'description', header: t('common.description'), className: 'hidden lg:table-cell max-w-xs', cell: (d) => <span className="line-clamp-2 text-slate-500">{d.description}</span> },
    { key: 'fieldCount', header: t('rec.f.fields'), sortable: true, align: 'center', cell: (d) => <Badge tone="blue" dot={false}>{d.fieldCount}</Badge> },
  ];
  return (
    <EntityTable<Domain, { code: string; name: string; nameAr: string; description: string }>
      fetcher={(p) => recordsService.domains.list(p)} columns={columns} rowName={(d) => d.name} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'name', dir: 'asc' }}
      canManage={canManage} createLabel={t('rec.entity.newDomain')} editTitle={t('rec.entity.editDomain')}
      initialValues={(d) => ({ code: d?.code ?? '', name: d?.name ?? '', nameAr: d?.nameAr ?? '', description: d?.description ?? '' })}
      fields={() => [...codeName(t), { name: 'description', label: t('rec.f.description'), type: 'textarea' }]} rules={baseRules}
      onCreate={(v) => recordsService.domains.create(v)} onUpdate={(d, v) => recordsService.domains.update(d.id, v)} onDelete={(d) => recordsService.domains.remove(d.id)}
      detailsTitle={(d) => `${d.code} · ${loc(d.name, d.nameAr)}`}
      renderDetails={(d) => (
        <>
          <DescriptionList items={[{ label: t('rec.f.code'), value: d.code }, { label: t('rec.f.fields'), value: d.fieldCount }, { label: t('rec.f.name'), value: d.name }, { label: t('rec.f.nameAr'), value: <span dir="rtl">{d.nameAr}</span> }, { label: t('common.description'), value: d.description, full: true }]} />
          <Section title={t('rec.details.fieldsOf')}><ChildList fetcher={() => recordsService.fields.list({ domainId: d.id, pageSize: 100 }).then((r) => r.items)} render={(f: Field) => <><span className="font-medium">{loc(f.name, f.nameAr)}</span><Badge tone="slate" dot={false}>{f.code}</Badge></>} /></Section>
        </>
      )}
    />
  );
}

// ------------------------------------------------------------------------------------------------ Fields
export function FieldsTab() {
  const { t, loc } = useI18n();
  const canManage = useManage();
  const domains = useAsync(() => recordsService.domains.list({ pageSize: 100 }), []);
  const domainOpts: Option[] = (domains.data?.items ?? []).map((d) => ({ value: d.id, label: loc(d.name, d.nameAr) })).sort(byName);
  const columns: Column<Field>[] = [
    { key: 'code', header: t('rec.f.code'), sortable: true, cell: (f) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">{f.code}</span> },
    { key: 'name', header: t('common.name'), sortable: true, cell: (f) => <span className="font-semibold text-slate-800">{loc(f.name, f.nameAr)}</span> },
    { key: 'domainName', header: t('rec.f.domain'), sortable: true, className: 'hidden md:table-cell', cell: (f) => loc(f.domainName, f.domainNameAr) },
    { key: 'specialtyCount', header: t('rec.f.specialties'), sortable: true, align: 'center', cell: (f) => <Badge tone="blue" dot={false}>{f.specialtyCount}</Badge> },
  ];
  return (
    <EntityTable<Field, { code: string; name: string; nameAr: string; description: string; domainId: string }>
      fetcher={(p) => recordsService.fields.list(p)} columns={columns} rowName={(f) => f.name} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'name', dir: 'asc' }}
      filters={[{ key: 'domainId', allLabel: t('rec.f.allDomains'), options: domainOpts }]}
      canManage={canManage} createLabel={t('rec.entity.newField')} editTitle={t('rec.entity.editField')}
      initialValues={(f) => ({ code: f?.code ?? '', name: f?.name ?? '', nameAr: f?.nameAr ?? '', description: f?.description ?? '', domainId: f?.domainId ?? '' })}
      fields={() => [{ name: 'domainId', label: t('rec.f.domain'), type: 'select', required: true, options: domainOpts, full: true }, ...codeName(t), { name: 'description', label: t('rec.f.description'), type: 'textarea' }]}
      rules={{ ...baseRules, domainId: [required()] }}
      onCreate={(v) => recordsService.fields.create(v)} onUpdate={(f, v) => recordsService.fields.update(f.id, v)} onDelete={(f) => recordsService.fields.remove(f.id)}
      detailsTitle={(f) => `${f.code} · ${loc(f.name, f.nameAr)}`}
      renderDetails={(f) => (
        <>
          <DescriptionList items={[{ label: t('rec.f.code'), value: f.code }, { label: t('rec.f.domain'), value: loc(f.domainName, f.domainNameAr) }, { label: t('rec.f.name'), value: f.name }, { label: t('rec.f.nameAr'), value: <span dir="rtl">{f.nameAr}</span> }, { label: t('common.description'), value: f.description, full: true }]} />
          <Section title={t('rec.details.specialtiesOf')}><ChildList fetcher={() => recordsService.specialties.list({ fieldId: f.id, pageSize: 100 }).then((r) => r.items)} render={(s: Specialty) => <><span className="font-medium">{loc(s.name, s.nameAr)}</span><Badge tone="slate" dot={false}>{s.code}</Badge></>} /></Section>
        </>
      )}
    />
  );
}

// ------------------------------------------------------------------------------------------------ Specialties
export function SpecialtiesTab() {
  const { t, loc } = useI18n();
  const canManage = useManage();
  const fields = useAsync(() => recordsService.fields.list({ pageSize: 100 }), []);
  const fieldOpts: Option[] = (fields.data?.items ?? []).map((f) => ({ value: f.id, label: loc(f.name, f.nameAr) })).sort(byName);
  const columns: Column<Specialty>[] = [
    { key: 'code', header: t('rec.f.code'), sortable: true, cell: (s) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">{s.code}</span> },
    { key: 'name', header: t('common.name'), sortable: true, cell: (s) => <span className="font-semibold text-slate-800">{loc(s.name, s.nameAr)}</span> },
    { key: 'fieldName', header: t('rec.f.field'), sortable: true, className: 'hidden md:table-cell', cell: (s) => loc(s.fieldName, s.fieldNameAr) },
    { key: 'domainName', header: t('rec.f.domain'), className: 'hidden xl:table-cell', cell: (s) => s.domainName },
    { key: 'programCount', header: t('rec.f.programs'), sortable: true, align: 'center', cell: (s) => <Badge tone="blue" dot={false}>{s.programCount}</Badge> },
  ];
  return (
    <EntityTable<Specialty, { code: string; name: string; nameAr: string; description: string; fieldId: string }>
      fetcher={(p) => recordsService.specialties.list(p)} columns={columns} rowName={(s) => s.name} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'name', dir: 'asc' }}
      filters={[{ key: 'fieldId', allLabel: t('rec.f.allFields'), options: fieldOpts }]}
      canManage={canManage} createLabel={t('rec.entity.newSpecialty')} editTitle={t('rec.entity.editSpecialty')}
      initialValues={(s) => ({ code: s?.code ?? '', name: s?.name ?? '', nameAr: s?.nameAr ?? '', description: s?.description ?? '', fieldId: s?.fieldId ?? '' })}
      fields={() => [{ name: 'fieldId', label: t('rec.f.field'), type: 'select', required: true, options: fieldOpts, full: true }, ...codeName(t), { name: 'description', label: t('rec.f.description'), type: 'textarea' }]}
      rules={{ ...baseRules, fieldId: [required()] }}
      onCreate={(v) => recordsService.specialties.create(v)} onUpdate={(s, v) => recordsService.specialties.update(s.id, v)} onDelete={(s) => recordsService.specialties.remove(s.id)}
      detailsTitle={(s) => `${s.code} · ${loc(s.name, s.nameAr)}`}
      renderDetails={(s) => (
        <>
          <DescriptionList items={[{ label: t('rec.f.code'), value: s.code }, { label: t('rec.f.field'), value: loc(s.fieldName, s.fieldNameAr) }, { label: t('rec.f.domain'), value: s.domainName }, { label: t('rec.f.programs'), value: s.programCount }, { label: t('common.description'), value: s.description, full: true }]} />
          <Section title={t('rec.details.programsOf')}><ChildList fetcher={() => recordsService.programs.list({ specialtyId: s.id, pageSize: 20 }).then((r) => r.items)} render={(p: Program) => <><span className="flex items-center gap-2 font-medium"><LevelBadge level={p.level} />{loc(p.name, p.nameAr)}</span><Link to={`/records/structure/programs/${p.id}`} className="text-xs font-semibold text-brand-600 hover:underline">{t('rec.details.openProgram')}</Link></>} /></Section>
        </>
      )}
    />
  );
}

// ------------------------------------------------------------------------------------------------ Programs
export function ProgramsTab() {
  const { t, loc, formatNumber } = useI18n();
  const canManage = useManage();
  const specs = useAsync(() => recordsService.specialties.list({ pageSize: 100 }), []);
  const specOpts: Option[] = (specs.data?.items ?? []).map((s) => ({ value: s.id, label: loc(s.name, s.nameAr) })).sort(byName);
  const levelOpts = ACADEMIC_LEVELS.map((l) => ({ value: l, label: l }));
  const columns: Column<Program>[] = [
    { key: 'code', header: t('rec.f.code'), sortable: true, cell: (p) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">{p.code}</span> },
    { key: 'name', header: t('common.name'), sortable: true, cell: (p) => <Link to={`/records/structure/programs/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-slate-800 hover:text-brand-600 hover:underline">{loc(p.name, p.nameAr)}</Link> },
    { key: 'level', header: t('rec.f.level'), sortable: true, cell: (p) => <div className="flex items-center gap-1.5"><LevelBadge level={p.level} /><span className="hidden text-xs text-slate-400 xl:inline">{t(`rec.cycle.${p.cycle}`)}</span></div> },
    { key: 'specialtyName', header: t('rec.f.specialty'), sortable: true, className: 'hidden lg:table-cell', cell: (p) => loc(p.specialtyName, p.specialtyNameAr) },
    { key: 'totalCredits', header: t('rec.f.credits'), align: 'center', className: 'hidden md:table-cell', cell: (p) => p.totalCredits },
    { key: 'studentCount', header: t('rec.f.students'), sortable: true, align: 'center', cell: (p) => formatNumber(p.studentCount) },
    { key: 'versions', header: t('rec.f.version'), className: 'hidden xl:table-cell', cell: (p) => <Badge tone="green" dot={false}>{p.versions.find((v) => v.id === p.currentVersionId)?.label}</Badge> },
  ];
  type V = { code: string; name: string; nameAr: string; level: string; specialtyId: string; totalCredits: string };
  return (
    <EntityTable<Program, V>
      fetcher={(p) => recordsService.programs.list(p)} columns={columns} rowName={(p) => p.name} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'level', dir: 'asc' }}
      filters={[{ key: 'level', allLabel: t('rec.f.allLevels'), options: levelOpts }, { key: 'specialtyId', allLabel: t('rec.f.allSpecialties'), options: specOpts }]}
      canManage={canManage} createLabel={t('rec.entity.newProgram')} editTitle={t('rec.entity.editProgram')}
      initialValues={(p) => ({ code: p?.code ?? '', name: p?.name ?? '', nameAr: p?.nameAr ?? '', level: p?.level ?? '', specialtyId: p?.specialtyId ?? '', totalCredits: String(p?.totalCredits ?? 60) })}
      fields={(_, editing) => [
        { name: 'specialtyId', label: t('rec.f.specialty'), type: 'select', required: true, options: specOpts, disabled: !!editing },
        { name: 'level', label: t('rec.f.level'), type: 'select', required: true, options: levelOpts, disabled: !!editing, hint: editing ? t('rec.f.programHint') : undefined },
        ...codeName(t),
        { name: 'totalCredits', label: t('rec.f.totalCredits'), type: 'number', required: true },
      ]}
      rules={{ ...baseRules, level: [required()], specialtyId: [required()], totalCredits: [required(), numberBetween(1, 300)] }}
      onCreate={(v) => recordsService.programs.create({ ...v, totalCredits: Number(v.totalCredits) })} onUpdate={(p, v) => recordsService.programs.update(p.id, { ...v, totalCredits: Number(v.totalCredits) })} onDelete={(p) => recordsService.programs.remove(p.id)}
      detailsTitle={(p) => `${p.code} · ${loc(p.name, p.nameAr)}`}
      renderDetails={(p) => (
        <>
          <DescriptionList columns={3} items={[{ label: t('rec.f.level'), value: <LevelBadge level={p.level} /> }, { label: t('rec.f.cycle'), value: t(`rec.cycle.${p.cycle}`) }, { label: t('rec.f.totalCredits'), value: p.totalCredits }, { label: t('rec.f.specialty'), value: loc(p.specialtyName, p.specialtyNameAr) }, { label: t('rec.f.field'), value: p.fieldName }, { label: t('rec.f.domain'), value: p.domainName }]} />
          <Section title={t('rec.program.versions')}>
            <ul className="space-y-2">{p.versions.map((v) => <li key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm"><VersionBadge label={v.label} current={v.isCurrent} /><span className="text-slate-500">{v.endYear ? t('rec.program.period2', { start: v.startYear, end: v.endYear }) : t('rec.program.periodOpen', { start: v.startYear })}</span></li>)}</ul>
          </Section>
          <Link to={`/records/structure/programs/${p.id}`} className="mt-5 inline-flex"><Button icon={<ExternalLink className="h-4 w-4" />}>{t('rec.details.openProgram')}</Button></Link>
        </>
      )}
    />
  );
}

// shared lists of programs / semesters / UEs for cascading selects
function useStructureOptions() {
  const { loc } = useI18n();
  const filters = useAsync(() => recordsService.filters(), []);
  const sems = useAsync(() => recordsService.semesters.list({ pageSize: 1000 }), []);
  const ues = useAsync(() => recordsService.teachingUnits.list({ pageSize: 1000 }), []);
  const programOpts: Option[] = (filters.data?.programs ?? []).map((p) => ({ value: p.id, label: `${loc(p.name, p.nameAr)} (${p.level})` }));
  return { filters, sems, ues, programOpts, years: filters.data?.academicYears ?? [] };
}

// ------------------------------------------------------------------------------------------------ Semesters
export function SemestersTab() {
  const { t, loc } = useI18n();
  const canManage = useManage();
  const { programOpts, years } = useStructureOptions();
  const yearOpts = years.map((y) => ({ value: y, label: y }));
  const columns: Column<Semester>[] = [
    { key: 'number', header: t('rec.f.semester'), sortable: true, cell: (s) => <div><p className="font-semibold text-slate-800">{loc(s.name, s.nameAr)}</p><p className="text-xs text-slate-500">N° {s.number}</p></div> },
    { key: 'programName', header: t('rec.f.program'), sortable: true, cell: (s) => <span className="flex items-center gap-2"><LevelBadge level={s.programLevel} />{loc(s.programName, s.programNameAr)}</span> },
    { key: 'version', header: t('rec.f.version'), className: 'hidden lg:table-cell', cell: (s) => <VersionBadge label={s.versionLabel} current={s.isCurrentVersion} /> },
    { key: 'academicYear', header: t('rec.f.academicYear'), sortable: true, className: 'hidden md:table-cell', cell: (s) => <span className="ltr-text">{s.academicYear}</span> },
    { key: 'ueCount', header: t('rec.f.ues'), sortable: true, align: 'center', cell: (s) => <Badge tone="blue" dot={false}>{s.ueCount}</Badge> },
    { key: 'credits', header: t('rec.f.credits'), sortable: true, align: 'center', cell: (s) => s.credits },
  ];
  type V = { programId: string; number: string; name: string; nameAr: string; academicYear: string };
  return (
    <EntityTable<Semester, V>
      fetcher={(p) => recordsService.semesters.list(p)} columns={columns} rowName={(s) => `${s.name} – ${s.programName}`} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'programName', dir: 'asc' }}
      filters={[{ key: 'programId', allLabel: t('rec.f.allPrograms'), options: programOpts }, { key: 'academicYear', allLabel: t('rec.f.allYears'), options: yearOpts }]}
      canManage={canManage} createLabel={t('rec.entity.newSemester')} editTitle={t('rec.entity.editSemester')} rowLocked={(s) => !s.isCurrentVersion}
      formNote={<p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">{t('rec.f.semesterHint')}</p>}
      initialValues={(s) => ({ programId: s?.programId ?? '', number: String(s?.number ?? ''), name: s?.name ?? '', nameAr: s?.nameAr ?? '', academicYear: s?.academicYear ?? years[0] ?? '' })}
      fields={(_, editing) => [
        { name: 'programId', label: t('rec.f.program'), type: 'select', required: true, options: programOpts, disabled: !!editing, full: true },
        { name: 'number', label: t('rec.f.semesterNumber'), type: 'number', required: true, disabled: !!editing },
        { name: 'academicYear', label: t('rec.f.academicYear'), type: 'select', required: true, options: yearOpts },
        { name: 'name', label: t('rec.f.name'), required: true }, { name: 'nameAr', label: t('rec.f.nameAr'), dir: 'rtl' },
      ]}
      rules={{ programId: [required()], number: [required(), numberBetween(1, 10)], name: [required(), maxLen(80)], nameAr: [maxLen(80)], academicYear: [required()] }}
      onCreate={(v) => recordsService.semesters.create({ ...v, number: Number(v.number) })} onUpdate={(s, v) => recordsService.semesters.update(s.id, { ...v, number: Number(v.number) })} onDelete={(s) => recordsService.semesters.remove(s.id)}
      detailsTitle={(s) => `${loc(s.name, s.nameAr)} · ${s.programLevel}`}
      renderDetails={(s) => (
        <>
          <DescriptionList columns={3} items={[{ label: t('rec.f.semesterNumber'), value: s.number }, { label: t('rec.f.program'), value: loc(s.programName, s.programNameAr) }, { label: t('rec.f.academicYear'), value: <span className="ltr-text">{s.academicYear}</span> }, { label: t('rec.f.version'), value: <VersionBadge label={s.versionLabel} current={s.isCurrentVersion} /> }, { label: t('rec.f.credits'), value: s.credits }, { label: t('rec.f.ues'), value: s.ueCount }]} />
          {!s.isCurrentVersion && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{t('rec.entity.historicalLocked')}</p>}
          <Section title={t('rec.details.uesOf')}>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">{s.ues.map((u) => <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="font-medium">{loc(u.name, u.nameAr)}</span><span className="flex items-center gap-3"><UETypeBadge type={u.type} /><span className="text-xs font-semibold text-slate-500">{u.credits} {t('rec.f.credits').toLowerCase()}</span></span></li>)}</ul>
          </Section>
        </>
      )}
    />
  );
}

// ------------------------------------------------------------------------------------------------ Teaching units
export function UnitsTab() {
  const { t, loc } = useI18n();
  const canManage = useManage();
  const { programOpts, sems } = useStructureOptions();
  const typeOpts = UE_TYPES.map((x) => ({ value: x, label: t(`rec.ueType.${x}`) }));
  const currentSems = (sems.data?.items ?? []).filter((s) => s.isCurrentVersion);
  const columns: Column<TeachingUnit>[] = [
    { key: 'code', header: t('rec.f.code'), sortable: true, cell: (u) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">{u.code}</span> },
    { key: 'name', header: t('common.name'), sortable: true, cell: (u) => <div><p className="font-semibold text-slate-800">{loc(u.name, u.nameAr)}</p><p className="text-xs text-slate-500">{u.programLevel} · {u.semesterName}</p></div> },
    { key: 'type', header: t('rec.f.ueType'), sortable: true, cell: (u) => <UETypeBadge type={u.type} /> },
    { key: 'programName', header: t('rec.f.program'), sortable: true, className: 'hidden xl:table-cell', cell: (u) => loc(u.programName, u.programNameAr) },
    { key: 'credits', header: t('rec.f.credits'), sortable: true, align: 'center', cell: (u) => u.credits },
    { key: 'coefficient', header: t('rec.f.coefficient'), sortable: true, align: 'center', className: 'hidden md:table-cell', cell: (u) => u.coefficient },
    { key: 'subjects', header: t('rec.f.subjects'), className: 'hidden lg:table-cell', cell: (u) => <div className="flex flex-wrap gap-1">{u.subjects.slice(0, 2).map((s) => <span key={s.id} className="max-w-[160px] truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{loc(s.name, s.nameAr)}</span>)}{u.subjects.length > 2 && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{t('rec.subjects.more', { n: u.subjects.length - 2 })}</span>}</div> },
  ];
  type V = { programId: string; semesterId: string; code: string; name: string; nameAr: string; type: string; credits: string; coefficient: string };
  return (
    <EntityTable<TeachingUnit, V>
      fetcher={(p) => recordsService.teachingUnits.list(p)} columns={columns} rowName={(u) => u.name} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'programName', dir: 'asc' }}
      filters={[{ key: 'programId', allLabel: t('rec.f.allPrograms'), options: programOpts }, { key: 'type', allLabel: t('rec.f.allTypes'), options: typeOpts }]}
      canManage={canManage} createLabel={t('rec.entity.newUE')} editTitle={t('rec.entity.editUE')} rowLocked={(u) => !u.isCurrentVersion}
      formNote={<p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">{t('rec.entity.formHistorical')}</p>}
      initialValues={(u) => ({ programId: u?.programId ?? '', semesterId: u?.semesterId ?? '', code: u?.code ?? '', name: u?.name ?? '', nameAr: u?.nameAr ?? '', type: u?.type ?? '', credits: String(u?.credits ?? ''), coefficient: String(u?.coefficient ?? '') })}
      fields={(v, editing) => [
        { name: 'programId', label: t('rec.f.program'), type: 'select', required: true, options: programOpts, disabled: !!editing, full: true },
        { name: 'semesterId', label: t('rec.f.semester'), type: 'select', required: true, disabled: !!editing || !v.programId, full: true, options: currentSems.filter((s) => s.programId === v.programId).map((s) => ({ value: s.id, label: loc(s.name, s.nameAr) })) },
        { name: 'code', label: t('rec.f.code'), required: true }, { name: 'type', label: t('rec.f.ueType'), type: 'select', required: true, options: typeOpts },
        { name: 'name', label: t('rec.f.name'), required: true, full: true }, { name: 'nameAr', label: t('rec.f.nameAr'), dir: 'rtl', full: true },
        { name: 'credits', label: t('rec.f.credits'), type: 'number', required: true }, { name: 'coefficient', label: t('rec.f.coefficient'), type: 'number', step: 0.5, required: true },
      ]}
      rules={{ programId: [required()], semesterId: [required()], code: [required(), maxLen(20)], name: [required(), maxLen(120)], nameAr: [maxLen(120)], type: [required()], credits: [required(), numberBetween(1, 30)], coefficient: [required(), numberBetween(0.5, 20)] }}
      onCreate={(v) => recordsService.teachingUnits.create({ ...v, credits: Number(v.credits), coefficient: Number(v.coefficient) })} onUpdate={(u, v) => recordsService.teachingUnits.update(u.id, { ...v, credits: Number(v.credits), coefficient: Number(v.coefficient) })} onDelete={(u) => recordsService.teachingUnits.remove(u.id)}
      detailsTitle={(u) => `${u.code} · ${loc(u.name, u.nameAr)}`}
      renderDetails={(u) => (
        <>
          <DescriptionList columns={3} items={[{ label: t('rec.f.ueType'), value: <UETypeBadge type={u.type} /> }, { label: t('rec.f.credits'), value: u.credits }, { label: t('rec.f.coefficient'), value: u.coefficient }, { label: t('rec.f.semester'), value: u.semesterName }, { label: t('rec.f.program'), value: loc(u.programName, u.programNameAr) }, { label: t('rec.f.version'), value: <VersionBadge label={u.versionLabel} current={u.isCurrentVersion} /> }]} />
          <Section title={t('rec.f.subjects')}>
            {u.subjects.length === 0 ? <p className="text-sm text-slate-500">{t('rec.details.noChildren')}</p> : <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">{u.subjects.map((s) => <li key={s.id} className="px-4 py-2.5 text-sm font-medium">{loc(s.name, s.nameAr)}</li>)}</ul>}
          </Section>
        </>
      )}
    />
  );
}

// ------------------------------------------------------------------------------------------------ Subjects
export function SubjectsTab() {
  const { t, loc } = useI18n();
  const canManage = useManage();
  const { programOpts, ues } = useStructureOptions();
  const typeOpts = UE_TYPES.map((x) => ({ value: x, label: t(`rec.ueType.${x}`) }));
  const currentUes = (ues.data?.items ?? []).filter((u) => u.isCurrentVersion);
  const hours = (n: number) => (n ? `${n}h` : '—');
  const columns: Column<Subject>[] = [
    { key: 'name', header: t('common.name'), sortable: true, cell: (s) => <div><p className="font-semibold text-slate-800">{loc(s.name, s.nameAr)}</p><p className="text-xs text-slate-500">{s.code}</p></div> },
    { key: 'ueName', header: t('rec.f.ue'), sortable: true, className: 'hidden md:table-cell', cell: (s) => <span className="flex items-center gap-2">{loc(s.ueName, s.ueNameAr)}<UETypeBadge type={s.ueType} /></span> },
    { key: 'programName', header: t('rec.f.program'), sortable: true, className: 'hidden xl:table-cell', cell: (s) => <span>{loc(s.programName, s.programNameAr)} <span className="text-xs text-slate-400">· {s.semesterName}</span></span> },
    { key: 'coefficient', header: t('rec.f.coefficient'), sortable: true, align: 'center', cell: (s) => s.coefficient },
    { key: 'lectureHours', header: t('rec.hours.lecture'), sortable: true, align: 'center', className: 'hidden sm:table-cell', cell: (s) => hours(s.lectureHours) },
    { key: 'tdHours', header: t('rec.hours.td'), sortable: true, align: 'center', className: 'hidden sm:table-cell', cell: (s) => hours(s.tdHours) },
    { key: 'tpHours', header: t('rec.hours.tp'), sortable: true, align: 'center', className: 'hidden sm:table-cell', cell: (s) => hours(s.tpHours) },
  ];
  type V = { programId: string; ueId: string; code: string; name: string; nameAr: string; coefficient: string; lectureHours: string; tdHours: string; tpHours: string };
  const num = (v: V) => ({ ...v, coefficient: Number(v.coefficient), lectureHours: Number(v.lectureHours || 0), tdHours: Number(v.tdHours || 0), tpHours: Number(v.tpHours || 0) });
  return (
    <EntityTable<Subject, V>
      fetcher={(p) => recordsService.subjects.list(p)} columns={columns} rowName={(s) => s.name} searchPlaceholder={t('rec.entity.search')} defaultSort={{ key: 'programName', dir: 'asc' }}
      filters={[{ key: 'programId', allLabel: t('rec.f.allPrograms'), options: programOpts }, { key: 'ueType', allLabel: t('rec.f.allTypes'), options: typeOpts }]}
      canManage={canManage} createLabel={t('rec.entity.newSubject')} editTitle={t('rec.entity.editSubject')} rowLocked={(s) => !s.isCurrentVersion}
      formNote={<p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">{t('rec.entity.formHistorical')}</p>}
      initialValues={(s) => ({ programId: s?.programId ?? '', ueId: s?.ueId ?? '', code: s?.code ?? '', name: s?.name ?? '', nameAr: s?.nameAr ?? '', coefficient: String(s?.coefficient ?? ''), lectureHours: String(s?.lectureHours ?? 0), tdHours: String(s?.tdHours ?? 0), tpHours: String(s?.tpHours ?? 0) })}
      fields={(v, editing) => [
        { name: 'programId', label: t('rec.f.program'), type: 'select', required: true, options: programOpts, disabled: !!editing, full: true },
        { name: 'ueId', label: t('rec.f.ue'), type: 'select', required: true, disabled: !!editing || !v.programId, full: true, options: currentUes.filter((u) => u.programId === v.programId).map((u) => ({ value: u.id, label: `${u.semesterName} · ${loc(u.name, u.nameAr)}` })) },
        { name: 'code', label: t('rec.f.code'), required: true }, { name: 'coefficient', label: t('rec.f.coefficient'), type: 'number', step: 0.5, required: true },
        { name: 'name', label: t('rec.f.name'), required: true, full: true }, { name: 'nameAr', label: t('rec.f.nameAr'), dir: 'rtl', full: true },
        { name: 'lectureHours', label: t('rec.f.lectureHours'), type: 'number', step: 0.5 }, { name: 'tdHours', label: t('rec.f.tdHours'), type: 'number', step: 0.5 }, { name: 'tpHours', label: t('rec.f.tpHours'), type: 'number', step: 0.5 },
      ]}
      rules={{ programId: [required()], ueId: [required()], code: [required(), maxLen(24)], name: [required(), maxLen(120)], nameAr: [maxLen(120)], coefficient: [required(), numberBetween(0.5, 20)], lectureHours: [numberBetween(0, 200)], tdHours: [numberBetween(0, 200)], tpHours: [numberBetween(0, 200)] }}
      onCreate={(v) => recordsService.subjects.create(num(v))} onUpdate={(s, v) => recordsService.subjects.update(s.id, num(v))} onDelete={(s) => recordsService.subjects.remove(s.id)}
      detailsTitle={(s) => `${s.code} · ${loc(s.name, s.nameAr)}`}
      renderDetails={(s) => (
        <DescriptionList columns={3} items={[{ label: t('rec.f.ue'), value: loc(s.ueName, s.ueNameAr) }, { label: t('rec.f.ueType'), value: <UETypeBadge type={s.ueType} /> }, { label: t('rec.f.coefficient'), value: s.coefficient }, { label: t('rec.hours.lecture'), value: `${s.lectureHours}h` }, { label: t('rec.hours.td'), value: `${s.tdHours}h` }, { label: t('rec.hours.tp'), value: `${s.tpHours}h` }, { label: t('rec.f.program'), value: loc(s.programName, s.programNameAr) }, { label: t('rec.f.semester'), value: s.semesterName }, { label: t('rec.f.version'), value: <VersionBadge label={s.versionLabel} current={s.isCurrentVersion} /> }]} />
      )}
    />
  );
}

// ------------------------------------------------------------------------------------------------ Hierarchy
function TreeNode({ node, depth, open, toggle }: { node: HierarchyNode; depth: number; open: Set<string>; toggle: (id: string) => void }) {
  const { t, loc } = useI18n();
  const hasKids = !!node.children?.length;
  const isOpen = open.has(node.id);
  const tone = { domain: 'bg-navy-800 text-white', field: 'bg-brand-100 text-brand-700', specialty: 'bg-violet-100 text-violet-700', program: 'bg-emerald-100 text-emerald-700' }[node.kind];
  const label = (
    <span className="flex min-w-0 items-center gap-2">
      <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase', tone)}>{node.kind === 'program' ? node.level : t(`rec.kind.${node.kind}`)}</span>
      <span className="truncate text-sm font-semibold text-slate-800">{loc(node.name, node.nameAr)}</span>
      <span className="hidden shrink-0 font-mono text-xs text-slate-400 sm:inline">{node.code}</span>
    </span>
  );
  return (
    <li>
      <div className="flex items-center gap-1 rounded-lg py-1 pe-2 hover:bg-slate-50" style={{ paddingInlineStart: depth * 22 + 4 }}>
        {hasKids ? <button onClick={() => toggle(node.id)} aria-expanded={isOpen} aria-label={loc(node.name, node.nameAr)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200"><ChevronRight className={cn('h-4 w-4 transition-transform rtl:rotate-180', isOpen && 'rotate-90 rtl:rotate-90')} /></button> : <span className="w-6 shrink-0" />}
        {node.kind === 'program' ? <Link to={`/records/structure/programs/${node.id}`} className="min-w-0 hover:underline">{label}</Link> : label}
        {hasKids && <span className="ms-auto text-xs text-slate-400">{node.children!.length}</span>}
      </div>
      {hasKids && isOpen && <ul>{node.children!.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} open={open} toggle={toggle} />)}</ul>}
    </li>
  );
}

export function HierarchyTab() {
  const { t } = useI18n();
  const { data, error, reload } = useAsync(() => recordsService.hierarchy(), []);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const all = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: HierarchyNode) => { if (n.children?.length) { ids.push(n.id); n.children.forEach(walk); } };
    data?.forEach(walk);
    return ids;
  }, [data]);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96 w-full rounded-2xl" />;
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-slate-500"><FolderTree className="h-4 w-4" />{t('rec.hierarchy.hint')}</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setOpen(new Set(all))}>{t('rec.hierarchy.expandAll')}</Button><Button size="sm" variant="secondary" onClick={() => setOpen(new Set())}>{t('rec.hierarchy.collapseAll')}</Button></div>
      </div>
      {data.length === 0 ? <EmptyState /> : <ul className="space-y-0.5">{data.map((n) => <TreeNode key={n.id} node={n} depth={0} open={open} toggle={toggle} />)}</ul>}
    </div>
  );
}
