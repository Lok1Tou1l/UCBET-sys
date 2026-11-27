import type { AcademicLevel, Cycle, Paginated } from '@/types/common';

export type UEType = 'fundamental' | 'methodological' | 'discovery' | 'transversal';
export const UE_TYPES: UEType[] = ['fundamental', 'methodological', 'discovery', 'transversal'];

export interface Domain {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  fieldCount: number;
}
export interface Field {
  id: string;
  code: string;
  domainId: string;
  domainName: string;
  domainNameAr?: string;
  name: string;
  nameAr: string;
  description: string;
  specialtyCount: number;
}
export interface Specialty {
  id: string;
  code: string;
  fieldId: string;
  fieldName: string;
  fieldNameAr?: string;
  domainId: string;
  domainName: string;
  name: string;
  nameAr: string;
  description: string;
  programCount: number;
}
export interface ProgramVersion {
  id: string;
  label: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
}
export interface Program {
  id: string;
  code: string;
  level: AcademicLevel;
  cycle: Cycle;
  specialtyId: string;
  specialtyName: string;
  specialtyNameAr?: string;
  fieldName: string;
  domainName: string;
  name: string;
  nameAr: string;
  totalCredits: number;
  versions: ProgramVersion[];
  currentVersionId: string;
  studentCount: number;
}
export interface Semester {
  id: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  programLevel: AcademicLevel;
  versionId: string;
  versionLabel: string;
  isCurrentVersion: boolean;
  number: number;
  name: string;
  nameAr?: string;
  academicYear: string;
  credits: number;
  ueCount: number;
  ues: { id: string; name: string; nameAr?: string; type: UEType; credits: number }[];
}
export interface TeachingUnit {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  type: UEType;
  semesterId: string;
  semesterName: string;
  semesterNumber: number;
  programId: string;
  programName: string;
  programNameAr?: string;
  programLevel: AcademicLevel;
  versionId: string;
  versionLabel: string;
  isCurrentVersion: boolean;
  credits: number;
  coefficient: number;
  subjects: { id: string; name: string; nameAr?: string }[];
}
export interface Subject {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  ueId: string;
  ueName: string;
  ueNameAr?: string;
  ueType: UEType;
  semesterId: string;
  semesterNumber: number;
  semesterName: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  programLevel: AcademicLevel;
  versionId: string;
  versionLabel: string;
  isCurrentVersion: boolean;
  coefficient: number;
  lectureHours: number;
  tdHours: number;
  tpHours: number;
}

export interface ProgramStructure {
  program: Program;
  version: ProgramVersion;
  semesters: (Omit<Semester, 'ues'> & { ues: (Omit<TeachingUnit, 'subjects'> & { subjects: Subject[] })[] })[];
}

export interface HierarchyNode {
  id: string;
  kind: 'domain' | 'field' | 'specialty' | 'program';
  code: string;
  name: string;
  nameAr?: string;
  level?: AcademicLevel;
  children?: HierarchyNode[];
}

// ---- students -------------------------------------------------------------------------------------
export type EnrollmentStatus = 'enrolled' | 'graduated' | 'suspended' | 'withdrawn';
export const ENROLLMENT_STATUSES: EnrollmentStatus[] = ['enrolled', 'graduated', 'suspended', 'withdrawn'];

export interface StudentListItem {
  id: string;
  studentId: string;
  name: string;
  email: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  specialty: string;
  specialtyAr?: string;
  level: AcademicLevel;
  academicYear: string;
  enrollmentStatus: EnrollmentStatus;
  creditsAcquired: number;
  creditsTarget: number;
  updatedAt: string;
}

export type SemesterResultStatus = 'validated' | 'compensated' | 'not_validated' | 'in_progress';
export type YearOutcome = 'passed' | 'repeated' | 'in_progress' | 'graduated' | 'withdrawn';

export interface SubjectResult {
  id: string;
  name: string;
  nameAr?: string;
  coefficient: number;
  lectureHours: number;
  tdHours: number;
  tpHours: number;
  mark: number | null;
  /** mark obtained at the resit session, when there was one */
  resitMark: number | null;
}
export interface UEResult {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  type: UEType;
  credits: number;
  coefficient: number;
  average: number | null;
  validated: boolean | null;
  /** validated through compensation rather than directly */
  compensated: boolean;
  creditsAcquired: number;
  subjects: SubjectResult[];
}
export interface SemesterResult {
  id: string;
  number: number;
  name: string;
  nameAr?: string;
  average: number | null;
  status: SemesterResultStatus;
  creditsAcquired: number;
  creditsTotal: number;
  resit: boolean;
  ues: UEResult[];
}
export interface YearResults {
  academicYear: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  level: AcademicLevel;
  versionId: string;
  versionLabel: string;
  isCurrentVersion: boolean;
  outcome: YearOutcome;
  semesters: SemesterResult[];
}
export interface EnrollmentRecord {
  academicYear: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  level: AcademicLevel;
  specialty: string;
  specialtyAr?: string;
  versionId: string;
  versionLabel: string;
  isCurrentVersion: boolean;
  enrollmentStatus: EnrollmentStatus;
  outcome: YearOutcome;
  creditsAcquired: number;
  creditsTotal: number;
  enrolledAt: string;
}
export interface ResultRules {
  /** provisional: values come from the backend configuration and are shown as-is */
  status: 'provisional' | 'official';
  passMark: number;
  compensation: string;
  resit: string;
  note?: string;
}
export interface StudentFile {
  profile: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    sex: 'M' | 'F';
    birthDate: string;
    birthPlace: string;
    nationality: string;
    email: string;
    phone: string;
    address: string;
  };
  current: StudentListItem;
  enrollments: EnrollmentRecord[];
  results: YearResults[];
  credits: { acquired: number; target: number; currentYearAcquired: number };
  rules: ResultRules;
  updatedAt: string;
}

export interface ResultRow {
  id: string;
  studentRecordId: string;
  studentId: string;
  studentName: string;
  academicYear: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  level: AcademicLevel;
  versionLabel: string;
  isCurrentVersion: boolean;
  semesterName: string;
  semesterNumber: number;
  average: number | null;
  status: SemesterResultStatus;
  ueValidated: number;
  ueTotal: number;
  creditsAcquired: number;
  creditsTotal: number;
  compensated: boolean;
  resit: boolean;
}
export interface ResultsOverview {
  rules: ResultRules;
  summary: { rows: number; validated: number; compensated: number; notValidated: number; inProgress: number; averageMark: number | null; creditsAcquired: number; creditsTotal: number };
  page: Paginated<ResultRow>;
}

export interface RecordsDashboard {
  totals: { students: number; enrolled: number; graduated: number; programs: number; specialties: number; recordsUpdated30d: number };
  byLevel: { level: AcademicLevel; count: number }[];
  byProgram: { programId: string; name: string; nameAr?: string; level: AcademicLevel; count: number }[];
  bySpecialty: { specialtyId: string; name: string; nameAr?: string; count: number }[];
  byYear: { academicYear: string; count: number }[];
  byStatus: { status: EnrollmentStatus; count: number }[];
  recentlyUpdated: StudentListItem[];
}

export interface RecordsFilters {
  academicYears: string[];
  programs: { id: string; name: string; nameAr?: string; level: AcademicLevel; specialtyId: string }[];
  specialties: { id: string; name: string; nameAr?: string }[];
}
