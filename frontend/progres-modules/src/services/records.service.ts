/**
 * Student Records (LMD) – API (backend owner: Mahzem Abdrahman).
 *
 * Endpoint contract used by this frontend (see README "API contracts"):
 *   GET    /records/dashboard
 *   GET    /records/filters
 *   GET    /records/hierarchy                                   domain → field → specialty → program tree
 *   CRUD   /records/domains            (GET list ?q&page&pageSize&sort&dir · GET/:id · POST · PUT/:id · DELETE/:id)
 *   CRUD   /records/fields             ?domainId
 *   CRUD   /records/specialties        ?fieldId&domainId
 *   CRUD   /records/programs           ?specialtyId&level&cycle
 *   GET    /records/programs/:id/structure?versionId=          semesters → UE → subjects for one program version
 *   CRUD   /records/semesters          ?programId&versionId&academicYear
 *   CRUD   /records/teaching-units     ?semesterId&programId&type&versionId
 *   CRUD   /records/subjects           ?ueId&semesterId&programId&versionId
 *   GET    /records/students           ?q&academicYear&programId&specialtyId&level&enrollmentStatus&sort&dir&page&pageSize
 *   GET    /records/students/:id       full academic file (profile, enrollments, results, credits, rules)
 *   GET    /records/results            ?q&academicYear&programId&level&status&sort&dir&page&pageSize
 *
 * Results, averages, validation and credits are ALWAYS computed by the backend; the frontend only displays them.
 */
import { http } from './http';
import type { ListParams, Paginated } from '@/types/common';
import type {
  Domain,
  Field,
  HierarchyNode,
  Program,
  ProgramStructure,
  RecordsDashboard,
  RecordsFilters,
  ResultsOverview,
  Semester,
  Specialty,
  StudentFile,
  StudentListItem,
  Subject,
  TeachingUnit,
} from '@/modules/records/types';

function crud<T, Payload = Partial<T>>(base: string) {
  return {
    list: (params?: ListParams) => http.get<Paginated<T>>(base, { params }).then((r) => r.data),
    get: (id: string) => http.get<T>(`${base}/${id}`).then((r) => r.data),
    create: (payload: Payload) => http.post<T>(base, payload).then((r) => r.data),
    update: (id: string, payload: Payload) => http.put<T>(`${base}/${id}`, payload).then((r) => r.data),
    remove: (id: string) => http.delete<void>(`${base}/${id}`).then(() => undefined),
  };
}

export interface DomainPayload { code: string; name: string; nameAr?: string; description?: string }
export interface FieldPayload extends DomainPayload { domainId: string }
export interface SpecialtyPayload extends DomainPayload { fieldId: string }
export interface ProgramPayload { code: string; name: string; nameAr?: string; level: string; specialtyId: string; totalCredits: number }
export interface SemesterPayload { programId: string; number: number; name: string; nameAr?: string; academicYear: string }
export interface UEPayload { semesterId: string; code: string; name: string; nameAr?: string; type: string; credits: number; coefficient: number }
export interface SubjectPayload { ueId: string; code: string; name: string; nameAr?: string; coefficient: number; lectureHours: number; tdHours: number; tpHours: number }

export const recordsService = {
  dashboard: () => http.get<RecordsDashboard>('/records/dashboard').then((r) => r.data),
  filters: () => http.get<RecordsFilters>('/records/filters').then((r) => r.data),
  hierarchy: () => http.get<HierarchyNode[]>('/records/hierarchy').then((r) => r.data),

  domains: crud<Domain, DomainPayload>('/records/domains'),
  fields: crud<Field, FieldPayload>('/records/fields'),
  specialties: crud<Specialty, SpecialtyPayload>('/records/specialties'),
  programs: {
    ...crud<Program, ProgramPayload>('/records/programs'),
    structure: (id: string, versionId?: string) => http.get<ProgramStructure>(`/records/programs/${id}/structure`, { params: { versionId } }).then((r) => r.data),
  },
  semesters: crud<Semester, SemesterPayload>('/records/semesters'),
  teachingUnits: crud<TeachingUnit, UEPayload>('/records/teaching-units'),
  subjects: crud<Subject, SubjectPayload>('/records/subjects'),

  listStudents: (params: ListParams) => http.get<Paginated<StudentListItem>>('/records/students', { params }).then((r) => r.data),
  getStudentFile: (id: string) => http.get<StudentFile>(`/records/students/${id}`).then((r) => r.data),
  results: (params: ListParams) => http.get<ResultsOverview>('/records/results', { params }).then((r) => r.data),
};
