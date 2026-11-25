/** Mock backend for Student Records (LMD): academic structure CRUD, students, results. State is in memory. */
import { mock, MockHttpError } from '../server';
import { listQuery, norm } from '../query';
import { daysAgo, nextId } from '../seed';
import { domains, fields, specialties, programs, domainById, fieldById, specialtyById, programById, type CatalogProgram } from '../data/catalog';
import { semesters, ues, subjects, semesterById, ueById, uesOfSemester, subjectsOfUE, semestersOfProgramVersion, currentYear, type SemRec, type UERec, type SubRec } from '../data/academic';
import { allStudentFiles, allStudentItems, getStudentFile, RULES, CURRENT_YEAR } from '../data/students';
import { ACADEMIC_LEVELS, type AcademicLevel } from '@/types/common';
import type { Domain, Field, HierarchyNode, Program, ProgramStructure, RecordsDashboard, ResultRow, Semester, Specialty, StudentListItem, Subject, TeachingUnit } from '@/modules/records/types';

const years = (() => {
  const y = Number(CURRENT_YEAR.slice(0, 4));
  return Array.from({ length: 8 }, (_, i) => `${y - i}/${y - i + 1}`);
})();

// ---- enrichers --------------------------------------------------------------------------------------
const programRow = (p: CatalogProgram): Program => {
  const sp = specialtyById(p.specialtyId)!;
  const fl = fieldById(sp.fieldId)!;
  const dm = domainById(fl.domainId)!;
  return {
    id: p.id, code: p.code, level: p.level, cycle: p.cycle, specialtyId: p.specialtyId, specialtyName: sp.name, specialtyNameAr: sp.nameAr, fieldName: fl.name, domainName: dm.name,
    name: p.name, nameAr: p.nameAr, totalCredits: p.totalCredits, versions: p.versions, currentVersionId: p.currentVersionId,
    studentCount: allStudentItems().filter((s) => s.programId === p.id && s.enrollmentStatus === 'enrolled').length,
  };
};
const domainRow = (d: (typeof domains)[number]): Domain => ({ ...d, fieldCount: fields.filter((f) => f.domainId === d.id).length });
const fieldRow = (f: (typeof fields)[number]): Field => {
  const d = domainById(f.domainId)!;
  return { ...f, domainName: d.name, domainNameAr: d.nameAr, specialtyCount: specialties.filter((s) => s.fieldId === f.id).length };
};
const specialtyRow = (s: (typeof specialties)[number]): Specialty => {
  const f = fieldById(s.fieldId)!;
  const d = domainById(f.domainId)!;
  return { ...s, fieldName: f.name, fieldNameAr: f.nameAr, domainId: d.id, domainName: d.name, programCount: programs.filter((p) => p.specialtyId === s.id).length };
};
const versionOf = (programId: string, versionId: string) => programById(programId)?.versions.find((v) => v.id === versionId);
const semesterRow = (s: SemRec): Semester => {
  const p = programById(s.programId)!;
  const v = versionOf(s.programId, s.versionId)!;
  const list = uesOfSemester(s.id);
  return {
    id: s.id, programId: p.id, programName: p.name, programNameAr: p.nameAr, programLevel: p.level, versionId: v.id, versionLabel: v.label, isCurrentVersion: v.isCurrent,
    number: s.number, name: s.name, nameAr: s.nameAr, academicYear: s.academicYear, credits: list.reduce((a, u) => a + u.credits, 0), ueCount: list.length,
    ues: list.map((u) => ({ id: u.id, name: u.name, nameAr: u.nameAr, type: u.type, credits: u.credits })),
  };
};
const ueRow = (u: UERec): TeachingUnit => {
  const s = semesterById(u.semesterId)!;
  const p = programById(s.programId)!;
  const v = versionOf(s.programId, s.versionId)!;
  return {
    id: u.id, code: u.code, name: u.name, nameAr: u.nameAr, type: u.type, semesterId: s.id, semesterName: s.name, semesterNumber: s.number, programId: p.id, programName: p.name, programNameAr: p.nameAr, programLevel: p.level,
    versionId: v.id, versionLabel: v.label, isCurrentVersion: v.isCurrent, credits: u.credits, coefficient: u.coefficient, subjects: subjectsOfUE(u.id).map((x) => ({ id: x.id, name: x.name, nameAr: x.nameAr })),
  };
};
const subjectRow = (x: SubRec): Subject => {
  const u = ueById(x.ueId)!;
  const s = semesterById(u.semesterId)!;
  const p = programById(s.programId)!;
  const v = versionOf(s.programId, s.versionId)!;
  return {
    id: x.id, code: x.code, name: x.name, nameAr: x.nameAr, ueId: u.id, ueName: u.name, ueNameAr: u.nameAr, ueType: u.type, semesterId: s.id, semesterNumber: s.number, semesterName: s.name, programId: p.id, programName: p.name, programNameAr: p.nameAr,
    programLevel: p.level, versionId: v.id, versionLabel: v.label, isCurrentVersion: v.isCurrent, coefficient: x.coefficient, lectureHours: x.lectureHours, tdHours: x.tdHours, tpHours: x.tpHours,
  };
};

const fail = (status: number, message: string, errors?: Record<string, string>) => {
  throw new MockHttpError(status, message, errors);
};
const need = (v: unknown, field: string, msg = 'Champ obligatoire') => {
  if (v === undefined || v === null || String(v).trim() === '') fail(422, msg, { [field]: msg });
};
const num = (v: unknown, field: string, min: number, max: number) => {
  const n = Number(v);
  if (Number.isNaN(n) || n < min || n > max) fail(422, `Valeur invalide pour « ${field} »`, { [field]: `${min}–${max}` });
  return n;
};
const historical = (versionId: string, programId: string) => {
  if (!versionOf(programId, versionId)?.isCurrent) fail(409, 'Cette version de programme est historique et ne peut pas être modifiée.');
};

// ---- dashboard / filters / hierarchy ----------------------------------------------------------------
mock.get('/records/filters', () => ({
  academicYears: years,
  programs: programs.map((p) => ({ id: p.id, name: p.name, nameAr: p.nameAr, level: p.level, specialtyId: p.specialtyId })),
  specialties: specialties.map((s) => ({ id: s.id, name: s.name, nameAr: s.nameAr })),
}));

mock.get('/records/hierarchy', (): HierarchyNode[] =>
  domains.map((d) => ({
    id: d.id, kind: 'domain', code: d.code, name: d.name, nameAr: d.nameAr,
    children: fields.filter((f) => f.domainId === d.id).map((f) => ({
      id: f.id, kind: 'field', code: f.code, name: f.name, nameAr: f.nameAr,
      children: specialties.filter((s) => s.fieldId === f.id).map((s) => ({
        id: s.id, kind: 'specialty', code: s.code, name: s.name, nameAr: s.nameAr,
        children: programs.filter((p) => p.specialtyId === s.id).map((p) => ({ id: p.id, kind: 'program', code: p.code, name: p.name, nameAr: p.nameAr, level: p.level })),
      })),
    })),
  })),
);

mock.get('/records/dashboard', (): RecordsDashboard => {
  const items = allStudentItems();
  const enrolled = items.filter((s) => s.enrollmentStatus === 'enrolled');
  const count = <K extends string>(rows: StudentListItem[], key: (s: StudentListItem) => K) => {
    const m = new Map<K, number>();
    rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1));
    return m;
  };
  const byLevel = count(enrolled, (s) => s.level);
  const byProgram = [...count(enrolled, (s) => s.programId)].map(([id, c]) => ({ p: programById(id)!, c })).sort((a, b) => b.c - a.c).slice(0, 8);
  const bySpec = [...count(enrolled, (s) => s.specialty)].map(([name, c]) => ({ sp: specialties.find((x) => x.name === name)!, c })).sort((a, b) => b.c - a.c);
  const byStatus = count(items, (s) => s.enrollmentStatus);
  const yearCounts = new Map<string, number>();
  allStudentFiles().forEach((f) => f.enrollments.forEach((e) => yearCounts.set(e.academicYear, (yearCounts.get(e.academicYear) ?? 0) + 1)));
  const cutoff = daysAgo(30);
  return {
    totals: { students: items.length, enrolled: enrolled.length, graduated: items.filter((s) => s.enrollmentStatus === 'graduated').length, programs: programs.length, specialties: specialties.length, recordsUpdated30d: items.filter((s) => s.updatedAt >= cutoff).length },
    byLevel: ACADEMIC_LEVELS.map((level) => ({ level, count: byLevel.get(level) ?? 0 })),
    byProgram: byProgram.map(({ p, c }) => ({ programId: p.id, name: p.name, nameAr: p.nameAr, level: p.level, count: c })),
    bySpecialty: bySpec.map(({ sp, c }) => ({ specialtyId: sp.id, name: sp.name, nameAr: sp.nameAr, count: c })),
    byYear: [...yearCounts].map(([academicYear, c]) => ({ academicYear, count: c })).sort((a, b) => a.academicYear.localeCompare(b.academicYear)).slice(-7),
    byStatus: (['enrolled', 'graduated', 'suspended', 'withdrawn'] as const).map((status) => ({ status, count: byStatus.get(status) ?? 0 })),
    recentlyUpdated: [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 7),
  };
});

// ---- domains -----------------------------------------------------------------------------------------
const uniqueCode = (list: { id: string; code: string }[], code: string, selfId?: string) => {
  if (list.some((x) => x.id !== selfId && norm(x.code) === norm(code))) fail(409, `Le code « ${code} » existe déjà.`, { code: 'duplicate' });
};

mock.get('/records/domains', ({ query }) => listQuery(domains.map(domainRow), query, { searchFields: [(d) => d.name, (d) => d.code, (d) => d.nameAr], sorters: { name: (d) => d.name, code: (d) => d.code, fieldCount: (d) => d.fieldCount }, defaultSort: { key: 'name', dir: 'asc' } }));
mock.get('/records/domains/:id', ({ params }) => { const d = domainById(params.id); if (!d) fail(404, 'Domaine introuvable'); return domainRow(d!); });
mock.post('/records/domains', ({ body }) => {
  need(body.code, 'code'); need(body.name, 'name'); uniqueCode(domains, body.code);
  const d = { id: nextId('dom'), code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', description: body.description?.trim() ?? '' };
  domains.push(d);
  return domainRow(d);
});
mock.put('/records/domains/:id', ({ params, body }) => {
  const d = domainById(params.id); if (!d) fail(404, 'Domaine introuvable');
  need(body.code, 'code'); need(body.name, 'name'); uniqueCode(domains, body.code, d!.id);
  Object.assign(d!, { code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', description: body.description?.trim() ?? '' });
  return domainRow(d!);
});
mock.delete('/records/domains/:id', ({ params }) => {
  const i = domains.findIndex((d) => d.id === params.id); if (i < 0) fail(404, 'Domaine introuvable');
  if (fields.some((f) => f.domainId === params.id)) fail(409, 'Impossible de supprimer : ce domaine contient des filières.');
  domains.splice(i, 1);
  return null;
});

// ---- fields ------------------------------------------------------------------------------------------
mock.get('/records/fields', ({ query }) => listQuery(fields.map(fieldRow), query, { searchFields: [(f) => f.name, (f) => f.code, (f) => f.nameAr, (f) => f.domainName], filters: { domainId: (f) => f.domainId }, sorters: { name: (f) => f.name, code: (f) => f.code, domainName: (f) => f.domainName, specialtyCount: (f) => f.specialtyCount }, defaultSort: { key: 'name', dir: 'asc' } }));
mock.get('/records/fields/:id', ({ params }) => { const f = fieldById(params.id); if (!f) fail(404, 'Filière introuvable'); return fieldRow(f!); });
mock.post('/records/fields', ({ body }) => {
  need(body.code, 'code'); need(body.name, 'name'); need(body.domainId, 'domainId'); uniqueCode(fields, body.code);
  if (!domainById(body.domainId)) fail(422, 'Domaine inconnu', { domainId: 'unknown' });
  const f = { id: nextId('fld'), code: String(body.code).toUpperCase(), domainId: body.domainId, name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', description: body.description?.trim() ?? '' };
  fields.push(f);
  return fieldRow(f);
});
mock.put('/records/fields/:id', ({ params, body }) => {
  const f = fieldById(params.id); if (!f) fail(404, 'Filière introuvable');
  need(body.code, 'code'); need(body.name, 'name'); uniqueCode(fields, body.code, f!.id);
  if (body.domainId && !domainById(body.domainId)) fail(422, 'Domaine inconnu', { domainId: 'unknown' });
  Object.assign(f!, { code: String(body.code).toUpperCase(), domainId: body.domainId ?? f!.domainId, name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', description: body.description?.trim() ?? '' });
  return fieldRow(f!);
});
mock.delete('/records/fields/:id', ({ params }) => {
  const i = fields.findIndex((f) => f.id === params.id); if (i < 0) fail(404, 'Filière introuvable');
  if (specialties.some((s) => s.fieldId === params.id)) fail(409, 'Impossible de supprimer : cette filière contient des spécialités.');
  fields.splice(i, 1);
  return null;
});

// ---- specialties -------------------------------------------------------------------------------------
mock.get('/records/specialties', ({ query }) => listQuery(specialties.map(specialtyRow), query, { searchFields: [(s) => s.name, (s) => s.code, (s) => s.nameAr, (s) => s.fieldName], filters: { fieldId: (s) => s.fieldId, domainId: (s) => s.domainId }, sorters: { name: (s) => s.name, code: (s) => s.code, fieldName: (s) => s.fieldName, programCount: (s) => s.programCount }, defaultSort: { key: 'name', dir: 'asc' } }));
mock.get('/records/specialties/:id', ({ params }) => { const s = specialtyById(params.id); if (!s) fail(404, 'Spécialité introuvable'); return specialtyRow(s!); });
mock.post('/records/specialties', ({ body }) => {
  need(body.code, 'code'); need(body.name, 'name'); need(body.fieldId, 'fieldId'); uniqueCode(specialties, body.code);
  if (!fieldById(body.fieldId)) fail(422, 'Filière inconnue', { fieldId: 'unknown' });
  const s = { id: nextId('sp'), code: String(body.code).toUpperCase(), fieldId: body.fieldId, name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', description: body.description?.trim() ?? '' };
  specialties.push(s);
  return specialtyRow(s);
});
mock.put('/records/specialties/:id', ({ params, body }) => {
  const s = specialtyById(params.id); if (!s) fail(404, 'Spécialité introuvable');
  need(body.code, 'code'); need(body.name, 'name'); uniqueCode(specialties, body.code, s!.id);
  if (body.fieldId && !fieldById(body.fieldId)) fail(422, 'Filière inconnue', { fieldId: 'unknown' });
  Object.assign(s!, { code: String(body.code).toUpperCase(), fieldId: body.fieldId ?? s!.fieldId, name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', description: body.description?.trim() ?? '' });
  return specialtyRow(s!);
});
mock.delete('/records/specialties/:id', ({ params }) => {
  const i = specialties.findIndex((s) => s.id === params.id); if (i < 0) fail(404, 'Spécialité introuvable');
  if (programs.some((p) => p.specialtyId === params.id)) fail(409, 'Impossible de supprimer : cette spécialité contient des programmes.');
  specialties.splice(i, 1);
  return null;
});

// ---- programs ----------------------------------------------------------------------------------------
mock.get('/records/programs', ({ query }) => listQuery(programs.map(programRow), query, { searchFields: [(p) => p.name, (p) => p.code, (p) => p.nameAr, (p) => p.specialtyName], filters: { specialtyId: (p) => p.specialtyId, level: (p) => p.level, cycle: (p) => p.cycle }, sorters: { name: (p) => p.name, code: (p) => p.code, level: (p) => p.level, specialtyName: (p) => p.specialtyName, studentCount: (p) => p.studentCount }, defaultSort: { key: 'level', dir: 'asc' } }));
mock.get('/records/programs/:id', ({ params }) => { const p = programById(params.id); if (!p) fail(404, 'Programme introuvable'); return programRow(p!); });
mock.post('/records/programs', ({ body }) => {
  need(body.code, 'code'); need(body.name, 'name'); need(body.specialtyId, 'specialtyId'); need(body.level, 'level');
  uniqueCode(programs, body.code);
  if (!specialtyById(body.specialtyId)) fail(422, 'Spécialité inconnue', { specialtyId: 'unknown' });
  if (!ACADEMIC_LEVELS.includes(body.level)) fail(422, 'Niveau invalide', { level: 'invalid' });
  if (programs.some((p) => p.specialtyId === body.specialtyId && p.level === body.level)) fail(409, 'Un programme existe déjà pour cette spécialité et ce niveau.', { level: 'duplicate' });
  const id = nextId('prg');
  const startYear = Number(currentYear.slice(0, 4));
  const p: CatalogProgram = { id, code: String(body.code).toUpperCase(), level: body.level as AcademicLevel, cycle: body.level.startsWith('L') ? 'licence' : 'master', specialtyId: body.specialtyId, name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', totalCredits: num(body.totalCredits ?? 60, 'totalCredits', 1, 300), currentVersionId: `${id}-v1`, versions: [{ id: `${id}-v1`, label: `Maquette ${startYear}`, startYear, endYear: null, isCurrent: true }] };
  programs.push(p);
  return programRow(p);
});
mock.put('/records/programs/:id', ({ params, body }) => {
  const p = programById(params.id); if (!p) fail(404, 'Programme introuvable');
  need(body.code, 'code'); need(body.name, 'name'); uniqueCode(programs, body.code, p!.id);
  Object.assign(p!, { code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', totalCredits: num(body.totalCredits ?? p!.totalCredits, 'totalCredits', 1, 300) });
  return programRow(p!);
});
mock.delete('/records/programs/:id', ({ params }) => {
  const i = programs.findIndex((p) => p.id === params.id); if (i < 0) fail(404, 'Programme introuvable');
  if (semesters.some((s) => s.programId === params.id) || allStudentItems().some((s) => s.programId === params.id)) fail(409, 'Impossible de supprimer : ce programme contient des semestres ou des étudiants.');
  programs.splice(i, 1);
  return null;
});
mock.get('/records/programs/:id/structure', ({ params, query }): ProgramStructure => {
  const p = programById(params.id); if (!p) fail(404, 'Programme introuvable');
  const v = p!.versions.find((x) => x.id === (query.versionId || p!.currentVersionId)); if (!v) fail(404, 'Version introuvable');
  return {
    program: programRow(p!), version: v!,
    semesters: semestersOfProgramVersion(p!.id, v!.id).map((s) => ({ ...semesterRow(s), ues: uesOfSemester(s.id).map((u) => ({ ...ueRow(u), subjects: subjectsOfUE(u.id).map(subjectRow) })) })),
  };
});

// ---- semesters ---------------------------------------------------------------------------------------
mock.get('/records/semesters', ({ query }) => listQuery(semesters.map(semesterRow), query, { searchFields: [(s) => s.name, (s) => s.programName, (s) => s.nameAr], filters: { programId: (s) => s.programId, versionId: (s) => s.versionId, academicYear: (s) => s.academicYear, programLevel: (s) => s.programLevel }, sorters: { number: (s) => s.number, programName: (s) => s.programName, academicYear: (s) => s.academicYear, credits: (s) => s.credits, ueCount: (s) => s.ueCount }, defaultSort: { key: 'programName', dir: 'asc' } }));
mock.get('/records/semesters/:id', ({ params }) => { const s = semesterById(params.id); if (!s) fail(404, 'Semestre introuvable'); return semesterRow(s!); });
mock.post('/records/semesters', ({ body }) => {
  need(body.programId, 'programId'); need(body.name, 'name'); need(body.academicYear, 'academicYear');
  const p = programById(body.programId); if (!p) fail(422, 'Programme inconnu', { programId: 'unknown' });
  const number = num(body.number, 'number', 1, 10);
  if (semesters.some((s) => s.programId === p!.id && s.versionId === p!.currentVersionId && s.number === number)) fail(409, 'Ce numéro de semestre existe déjà pour la version courante du programme.', { number: 'duplicate' });
  const s: SemRec = { id: nextId('sem'), programId: p!.id, versionId: p!.currentVersionId, number, name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', academicYear: body.academicYear };
  semesters.push(s);
  return semesterRow(s);
});
mock.put('/records/semesters/:id', ({ params, body }) => {
  const s = semesterById(params.id); if (!s) fail(404, 'Semestre introuvable');
  historical(s!.versionId, s!.programId);
  need(body.name, 'name'); need(body.academicYear, 'academicYear');
  Object.assign(s!, { name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', academicYear: body.academicYear });
  return semesterRow(s!);
});
mock.delete('/records/semesters/:id', ({ params }) => {
  const i = semesters.findIndex((s) => s.id === params.id); if (i < 0) fail(404, 'Semestre introuvable');
  historical(semesters[i].versionId, semesters[i].programId);
  if (uesOfSemester(params.id).length) fail(409, 'Impossible de supprimer : ce semestre contient des unités d\'enseignement.');
  semesters.splice(i, 1);
  return null;
});

// ---- teaching units ----------------------------------------------------------------------------------
const UE_TYPES = ['fundamental', 'methodological', 'discovery', 'transversal'];
mock.get('/records/teaching-units', ({ query }) => listQuery(ues.map(ueRow), query, { searchFields: [(u) => u.name, (u) => u.code, (u) => u.nameAr, (u) => u.programName, ...[(u: TeachingUnit) => u.subjects.map((s) => s.name).join(' ')]], filters: { semesterId: (u) => u.semesterId, programId: (u) => u.programId, versionId: (u) => u.versionId, type: (u) => u.type }, sorters: { name: (u) => u.name, code: (u) => u.code, type: (u) => u.type, credits: (u) => u.credits, coefficient: (u) => u.coefficient, semesterNumber: (u) => u.semesterNumber, programName: (u) => u.programName }, defaultSort: { key: 'programName', dir: 'asc' } }));
mock.get('/records/teaching-units/:id', ({ params }) => { const u = ueById(params.id); if (!u) fail(404, 'UE introuvable'); return ueRow(u!); });
const validateUE = (body: any, selfId?: string, semId?: string) => {
  need(body.code, 'code'); need(body.name, 'name'); need(body.type, 'type');
  if (!UE_TYPES.includes(body.type)) fail(422, 'Type d\'UE invalide', { type: 'invalid' });
  const credits = num(body.credits, 'credits', 1, 30); const coefficient = num(body.coefficient, 'coefficient', 0.5, 20);
  if (ues.some((u) => u.id !== selfId && u.semesterId === semId && norm(u.code) === norm(body.code))) fail(409, 'Ce code d\'UE existe déjà dans ce semestre.', { code: 'duplicate' });
  return { credits, coefficient };
};
mock.post('/records/teaching-units', ({ body }) => {
  need(body.semesterId, 'semesterId');
  const s = semesterById(body.semesterId); if (!s) fail(422, 'Semestre inconnu', { semesterId: 'unknown' });
  historical(s!.versionId, s!.programId);
  const { credits, coefficient } = validateUE(body, undefined, s!.id);
  const u: UERec = { id: nextId('ue'), semesterId: s!.id, code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', type: body.type, credits, coefficient };
  ues.push(u);
  return ueRow(u);
});
mock.put('/records/teaching-units/:id', ({ params, body }) => {
  const u = ueById(params.id); if (!u) fail(404, 'UE introuvable');
  const s = semesterById(u!.semesterId)!; historical(s.versionId, s.programId);
  const { credits, coefficient } = validateUE(body, u!.id, u!.semesterId);
  Object.assign(u!, { code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', type: body.type, credits, coefficient });
  return ueRow(u!);
});
mock.delete('/records/teaching-units/:id', ({ params }) => {
  const i = ues.findIndex((u) => u.id === params.id); if (i < 0) fail(404, 'UE introuvable');
  const s = semesterById(ues[i].semesterId)!; historical(s.versionId, s.programId);
  if (subjectsOfUE(params.id).length) fail(409, 'Impossible de supprimer : cette UE contient des matières.');
  ues.splice(i, 1);
  return null;
});

// ---- subjects ----------------------------------------------------------------------------------------
mock.get('/records/subjects', ({ query }) => listQuery(subjects.map(subjectRow), query, { searchFields: [(x) => x.name, (x) => x.code, (x) => x.nameAr, (x) => x.ueName, (x) => x.programName], filters: { ueId: (x) => x.ueId, semesterId: (x) => x.semesterId, programId: (x) => x.programId, versionId: (x) => x.versionId, ueType: (x) => x.ueType }, sorters: { name: (x) => x.name, code: (x) => x.code, coefficient: (x) => x.coefficient, lectureHours: (x) => x.lectureHours, tdHours: (x) => x.tdHours, tpHours: (x) => x.tpHours, ueName: (x) => x.ueName, programName: (x) => x.programName }, defaultSort: { key: 'programName', dir: 'asc' } }));
mock.get('/records/subjects/:id', ({ params }) => { const x = subjects.find((s) => s.id === params.id); if (!x) fail(404, 'Matière introuvable'); return subjectRow(x!); });
const validateSubject = (body: any, selfId?: string) => {
  need(body.code, 'code'); need(body.name, 'name');
  const coefficient = num(body.coefficient, 'coefficient', 0.5, 20);
  const lectureHours = num(body.lectureHours ?? 0, 'lectureHours', 0, 200); const tdHours = num(body.tdHours ?? 0, 'tdHours', 0, 200); const tpHours = num(body.tpHours ?? 0, 'tpHours', 0, 200);
  if (lectureHours + tdHours + tpHours === 0) fail(422, 'Au moins une catégorie d\'heures est requise.', { lectureHours: 'required' });
  return { coefficient, lectureHours, tdHours, tpHours };
};
mock.post('/records/subjects', ({ body }) => {
  need(body.ueId, 'ueId');
  const u = ueById(body.ueId); if (!u) fail(422, 'UE inconnue', { ueId: 'unknown' });
  const s = semesterById(u!.semesterId)!; historical(s.versionId, s.programId);
  const v = validateSubject(body);
  if (subjects.some((x) => x.ueId === u!.id && norm(x.code) === norm(body.code))) fail(409, 'Ce code de matière existe déjà dans cette UE.', { code: 'duplicate' });
  const x: SubRec = { id: nextId('sub'), ueId: u!.id, code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', ...v };
  subjects.push(x);
  return subjectRow(x);
});
mock.put('/records/subjects/:id', ({ params, body }) => {
  const x = subjects.find((s) => s.id === params.id); if (!x) fail(404, 'Matière introuvable');
  const sem = semesterById(ueById(x!.ueId)!.semesterId)!; historical(sem.versionId, sem.programId);
  const v = validateSubject(body, x!.id);
  Object.assign(x!, { code: String(body.code).toUpperCase(), name: body.name.trim(), nameAr: body.nameAr?.trim() ?? '', ...v });
  return subjectRow(x!);
});
mock.delete('/records/subjects/:id', ({ params }) => {
  const i = subjects.findIndex((s) => s.id === params.id); if (i < 0) fail(404, 'Matière introuvable');
  const sem = semesterById(ueById(subjects[i].ueId)!.semesterId)!; historical(sem.versionId, sem.programId);
  subjects.splice(i, 1);
  return null;
});

// ---- students & results ------------------------------------------------------------------------------
mock.get('/records/students', ({ query }) => {
  let rows = allStudentFiles();
  let items: StudentListItem[];
  if (query.academicYear) {
    // show each student as they were enrolled during that academic year
    items = rows.flatMap((f) => {
      const e = f.enrollments.find((x) => x.academicYear === query.academicYear);
      if (!e) return [];
      return [{ ...f.current, programId: e.programId, programName: e.programName, programNameAr: e.programNameAr, level: e.level, academicYear: e.academicYear, enrollmentStatus: e.enrollmentStatus, specialty: e.specialty, specialtyAr: e.specialtyAr, creditsAcquired: e.creditsAcquired, creditsTarget: e.creditsTotal }];
    });
  } else items = rows.map((f) => f.current);
  const specName = (id: string) => specialtyById(id)?.name;
  return listQuery(items, query, {
    searchFields: [(s) => s.name, (s) => s.studentId, (s) => s.email],
    filters: { programId: (s) => s.programId, level: (s) => s.level, enrollmentStatus: (s) => s.enrollmentStatus, specialtyId: (s) => specialties.find((x) => x.name === s.specialty)?.id },
    sorters: { name: (s) => s.name, studentId: (s) => s.studentId, academicYear: (s) => s.academicYear, programName: (s) => s.programName, level: (s) => s.level, enrollmentStatus: (s) => s.enrollmentStatus, creditsAcquired: (s) => s.creditsAcquired, updatedAt: (s) => s.updatedAt },
    defaultSort: { key: 'name', dir: 'asc' },
  });
});
mock.get('/records/students/:id', ({ params }) => { const f = getStudentFile(params.id); if (!f) fail(404, 'Dossier étudiant introuvable'); return f; });

mock.get('/records/results', ({ query }) => {
  const rows: ResultRow[] = allStudentFiles().flatMap((f) =>
    f.results.flatMap((y) =>
      y.semesters.map((s) => ({
        id: `${f.profile.id}-${y.academicYear}-${s.id}`, studentRecordId: f.profile.id, studentId: f.profile.studentId, studentName: f.current.name, academicYear: y.academicYear, programId: y.programId, programName: y.programName, programNameAr: y.programNameAr, level: y.level, versionLabel: y.versionLabel, isCurrentVersion: y.isCurrentVersion,
        semesterName: s.name, semesterNumber: s.number, average: s.average, status: s.status, ueValidated: s.ues.filter((u) => u.validated).length, ueTotal: s.ues.length, creditsAcquired: s.creditsAcquired, creditsTotal: s.creditsTotal, compensated: s.ues.some((u) => u.compensated), resit: s.resit,
      })),
    ),
  );
  const filtered = listQuery(rows, { ...query, page: 1, pageSize: 100000 }, {
    searchFields: [(r) => r.studentName, (r) => r.studentId],
    filters: { academicYear: (r) => r.academicYear, programId: (r) => r.programId, level: (r) => r.level, status: (r) => r.status },
  }).items;
  const done = filtered.filter((r) => r.average !== null);
  const summary = {
    rows: filtered.length,
    validated: filtered.filter((r) => r.status === 'validated').length,
    compensated: filtered.filter((r) => r.status === 'compensated').length,
    notValidated: filtered.filter((r) => r.status === 'not_validated').length,
    inProgress: filtered.filter((r) => r.status === 'in_progress').length,
    averageMark: done.length ? Math.round((done.reduce((a, r) => a + (r.average ?? 0), 0) / done.length) * 100) / 100 : null,
    creditsAcquired: filtered.reduce((a, r) => a + r.creditsAcquired, 0),
    creditsTotal: filtered.reduce((a, r) => a + r.creditsTotal, 0),
  };
  const page = listQuery(rows, query, {
    searchFields: [(r) => r.studentName, (r) => r.studentId],
    filters: { academicYear: (r) => r.academicYear, programId: (r) => r.programId, level: (r) => r.level, status: (r) => r.status },
    sorters: { studentName: (r) => r.studentName, academicYear: (r) => r.academicYear, programName: (r) => r.programName, semesterNumber: (r) => r.semesterNumber, average: (r) => r.average ?? -1, creditsAcquired: (r) => r.creditsAcquired, status: (r) => r.status },
    defaultSort: { key: 'academicYear', dir: 'desc' },
  });
  return { rules: RULES, summary, page };
});
