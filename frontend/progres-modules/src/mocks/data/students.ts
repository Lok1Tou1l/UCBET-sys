/**
 * Mock student academic records + a tiny "results engine" that plays the role of the backend.
 *
 * ⚠ The rules below (pass mark 10, compensation inside a semester, one resit session) are PROVISIONAL demo values.
 *   In production the real backend computes and returns averages / validation / credits and the rules in use;
 *   the frontend never re-computes them – it only displays what the API returns.
 */
import { createRng, mulberry32, currentAcademicYear, daysAgo } from '../seed';
import { people, fullName } from '../data/people';
import { programs, specialties, specialtyById, type CatalogProgram } from '../data/catalog';
import { semestersOfProgramVersion, uesOfSemester, subjectsOfUE, semesters as allSemesters } from './academic';
import type { AcademicLevel } from '@/types/common';
import type { EnrollmentRecord, EnrollmentStatus, ResultRules, SemesterResult, StudentFile, StudentListItem, UEResult, YearOutcome, YearResults } from '@/modules/records/types';

export const CURRENT_YEAR = currentAcademicYear();
const CUR = Number(CURRENT_YEAR.slice(0, 4));
const NEXT: Record<AcademicLevel, AcademicLevel | null> = { L1: 'L2', L2: 'L3', L3: 'M1', M1: 'M2', M2: null };

export const RULES: ResultRules = {
  status: 'provisional',
  passMark: 10,
  compensation: 'Compensation entre unités d\'enseignement au sein du semestre (moyenne semestrielle ≥ 10).',
  resit: 'Une session de rattrapage pour les matières dont la note est inférieure à 10 (la meilleure note est retenue).',
  note: 'Règles provisoires issues de la configuration du backend – à valider avec la réglementation officielle LMD.',
};

interface Enroll {
  academicYear: string;
  level: AcademicLevel;
  status: EnrollmentStatus;
  outcome: YearOutcome;
}
interface Rec {
  id: string;
  personIdx: number;
  specialtyId: string;
  ability: number;
  enrollments: Enroll[];
  updatedAt: string;
}

const rng = createRng(909);
const records: Rec[] = people.map((p, i) => {
  const entry = Number(p.studentId.slice(0, 4));
  const spec = rng.pick(specialties);
  const ability = Math.min(1, Math.max(0, 0.25 + rng.next() * 0.75));
  let level: AcademicLevel = rng.chance(0.78) ? 'L1' : 'M1';
  const enrollments: Enroll[] = [];
  for (let y = entry; y <= CUR; y++) {
    const year = `${y}/${y + 1}`;
    if (y === CUR) {
      enrollments.push({ academicYear: year, level, status: 'enrolled', outcome: 'in_progress' });
      break;
    }
    if (rng.chance(0.02)) {
      enrollments.push({ academicYear: year, level, status: 'withdrawn', outcome: 'withdrawn' });
      break;
    }
    const passed = rng.chance(0.55 + ability * 0.4);
    if (!passed) {
      enrollments.push({ academicYear: year, level, status: 'enrolled', outcome: 'repeated' });
      continue;
    }
    const next: AcademicLevel | null = NEXT[level];
    const stops = level === 'M2' || (level === 'L3' && !rng.chance(0.4));
    if (stops) {
      enrollments.push({ academicYear: year, level, status: 'graduated', outcome: 'graduated' });
      break;
    }
    enrollments.push({ academicYear: year, level, status: 'enrolled', outcome: 'passed' });
    level = next!;
  }
  const last = enrollments[enrollments.length - 1];
  if (last.outcome === 'in_progress' && rng.chance(0.03)) last.status = 'suspended';
  return { id: `S${String(i + 1).padStart(4, '0')}`, personIdx: i, specialtyId: spec.id, ability, enrollments, updatedAt: daysAgo(Math.floor(rng.next() * 75), rng.int(8, 17), rng.int(0, 59)) };
});

const programFor = (specialtyId: string, level: AcademicLevel): CatalogProgram => programs.find((p) => p.specialtyId === specialtyId && p.level === level)!;
const versionFor = (p: CatalogProgram, academicYear: string) => {
  const y = Number(academicYear.slice(0, 4));
  return p.versions.find((v) => y >= v.startYear && (v.endYear === null || y <= v.endYear)) ?? p.versions[p.versions.length - 1];
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampMark = (n: number) => Math.max(0, Math.min(20, round2(n)));

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** "backend" computation of one semester from raw marks */
function computeSemester(semesterId: string, studentKey: string, mode: 'pass' | 'fail' | 'none', ability: number): SemesterResult | null {
  const sem = semestersByIdCache(semesterId);
  if (!sem) return null;
  const r = mulberry32(hash(studentKey + semesterId));
  const gauss = () => (r() + r() + r() + r() - 2) * 1.7; // ~N(0,1.4)
  const base = mode === 'pass' ? 11.4 + ability * 2.2 : 6.8 + ability * 1.8;
  let anyResit = false;
  const ueResults: UEResult[] = uesOfSemester(semesterId).map((ue) => {
    const subs = subjectsOfUE(ue.id).map((s) => {
      let mark: number | null = null;
      let resit: number | null = null;
      if (mode !== 'none') {
        mark = clampMark(base + gauss() * 1.9);
        if (mark < RULES.passMark && mode === 'fail' && r() < 0.6) {
          resit = clampMark(mark + r() * 3.5);
          anyResit = true;
        }
      }
      return { id: s.id, name: s.name, nameAr: s.nameAr, coefficient: s.coefficient, lectureHours: s.lectureHours, tdHours: s.tdHours, tpHours: s.tpHours, mark, resitMark: resit };
    });
    let avg: number | null = null;
    if (mode !== 'none') {
      const tot = subs.reduce((a, s) => a + s.coefficient, 0);
      avg = round2(subs.reduce((a, s) => a + Math.max(s.mark ?? 0, s.resitMark ?? 0) * s.coefficient, 0) / tot);
    }
    return { id: ue.id, code: ue.code, name: ue.name, nameAr: ue.nameAr, type: ue.type, credits: ue.credits, coefficient: ue.coefficient, average: avg, validated: avg === null ? null : avg >= RULES.passMark, compensated: false, creditsAcquired: 0, subjects: subs };
  });
  const creditsTotal = ueResults.reduce((a, u) => a + u.credits, 0);
  if (mode === 'none') return { id: sem.id, number: sem.number, name: sem.name, nameAr: sem.nameAr, average: null, status: 'in_progress', creditsAcquired: 0, creditsTotal, resit: false, ues: ueResults };
  const semAvg = round2(ueResults.reduce((a, u) => a + (u.average ?? 0) * u.coefficient, 0) / ueResults.reduce((a, u) => a + u.coefficient, 0));
  let compensated = false;
  let acquired = 0;
  if (semAvg >= RULES.passMark) {
    ueResults.forEach((u) => {
      if (!u.validated) {
        u.compensated = true;
        u.validated = true;
        compensated = true;
      }
      u.creditsAcquired = u.credits;
    });
    acquired = creditsTotal;
  } else {
    ueResults.forEach((u) => {
      u.creditsAcquired = u.validated ? u.credits : 0;
      acquired += u.creditsAcquired;
    });
  }
  const status = semAvg >= RULES.passMark ? (compensated ? 'compensated' : 'validated') : 'not_validated';
  return { id: sem.id, number: sem.number, name: sem.name, nameAr: sem.nameAr, average: semAvg, status, creditsAcquired: acquired, creditsTotal, resit: anyResit, ues: ueResults };
}

const semCache = new Map(allSemesters.map((s) => [s.id, s]));
const semestersByIdCache = (id: string) => semCache.get(id);

const fileCache = new Map<string, StudentFile>();
const cycleTarget = (level: AcademicLevel) => (level.startsWith('L') ? 180 : 120);

function buildFile(rec: Rec): StudentFile {
  const cached = fileCache.get(rec.id);
  if (cached) return cached;
  const person = people[rec.personIdx];
  const spec = specialtyById(rec.specialtyId)!;
  const results: YearResults[] = [];
  const enrollments: EnrollmentRecord[] = [];
  const latestPerSemester = new Map<string, number>(); // `${level}-${semNumber}` -> credits (latest attempt)
  for (const e of rec.enrollments) {
    const program = programFor(rec.specialtyId, e.level);
    const version = versionFor(program, e.academicYear);
    const mode: 'pass' | 'fail' | 'none' = e.outcome === 'in_progress' || e.outcome === 'withdrawn' ? 'none' : e.outcome === 'repeated' ? 'fail' : 'pass';
    const sems = semestersOfProgramVersion(program.id, version.id).map((s, idx) => {
      // a repeated year: first semester usually validated, second failed
      const m: 'pass' | 'fail' | 'none' = mode === 'fail' ? (idx === 0 && hash(rec.id + e.academicYear) % 3 !== 0 ? 'pass' : 'fail') : mode;
      return computeSemester(s.id, rec.id + e.academicYear, m, rec.ability)!;
    });
    const acquired = sems.reduce((a, s) => a + s.creditsAcquired, 0);
    const total = sems.reduce((a, s) => a + s.creditsTotal, 0);
    sems.forEach((s) => {
      if (s.status !== 'in_progress') latestPerSemester.set(`${e.level}-${s.number}`, s.creditsAcquired);
    });
    const isCurrentVersion = version.isCurrent;
    results.push({ academicYear: e.academicYear, programId: program.id, programName: program.name, programNameAr: program.nameAr, level: e.level, versionId: version.id, versionLabel: version.label, isCurrentVersion, outcome: e.outcome, semesters: sems });
    enrollments.push({ academicYear: e.academicYear, programId: program.id, programName: program.name, programNameAr: program.nameAr, level: e.level, specialty: spec.name, specialtyAr: spec.nameAr, versionId: version.id, versionLabel: version.label, isCurrentVersion, enrollmentStatus: e.status, outcome: e.outcome, creditsAcquired: acquired, creditsTotal: total, enrolledAt: `${e.academicYear.slice(0, 4)}-09-${String(8 + (hash(rec.id) % 10)).padStart(2, '0')}` });
  }
  const last = rec.enrollments[rec.enrollments.length - 1];
  const lastProgram = programFor(rec.specialtyId, last.level);
  const acquiredTotal = [...latestPerSemester.values()].reduce((a, b) => a + b, 0);
  const current: StudentListItem = {
    id: rec.id,
    studentId: person.studentId,
    name: fullName(person),
    email: person.email,
    programId: lastProgram.id,
    programName: lastProgram.name,
    programNameAr: lastProgram.nameAr,
    specialty: spec.name,
    specialtyAr: spec.nameAr,
    level: last.level,
    academicYear: last.academicYear,
    enrollmentStatus: last.status,
    creditsAcquired: acquiredTotal,
    creditsTarget: cycleTarget(last.level),
    updatedAt: rec.updatedAt,
  };
  const file: StudentFile = {
    profile: { id: rec.id, studentId: person.studentId, firstName: person.firstName, lastName: person.lastName, sex: person.sex, birthDate: person.birthDate, birthPlace: person.birthPlace, nationality: person.nationality, email: person.email, phone: person.phone, address: person.address },
    current,
    enrollments: enrollments.reverse(),
    results: results.reverse(),
    credits: { acquired: acquiredTotal, target: cycleTarget(last.level), currentYearAcquired: results[0]?.semesters.reduce((a, s) => a + s.creditsAcquired, 0) ?? 0 },
    rules: RULES,
    updatedAt: rec.updatedAt,
  };
  fileCache.set(rec.id, file);
  return file;
}

export const studentRecords = records;
export const getStudentFile = (id: string) => {
  const rec = records.find((r) => r.id === id);
  return rec ? buildFile(rec) : undefined;
};
export const allStudentFiles = () => records.map(buildFile);
export const allStudentItems = () => allStudentFiles().map((f) => f.current);
