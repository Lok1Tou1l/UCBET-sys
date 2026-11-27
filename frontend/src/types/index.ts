export type Lang = "fr" | "ar";

/**
 * Canonical front-end role ids (lowercase, like the backend `users.role` column).
 * `normalizeRole` (lib/utils/roles.ts) maps backend aliases onto these ids.
 */
export type Role = "student" | "teacher" | "registrar" | "dept_head" | "renovation_manager" | "sys_admin";
export type RoleOrUnknown = Role | "unknown";
export const ROLES: Role[] = ["student", "teacher", "registrar", "dept_head", "renovation_manager", "sys_admin"];

export interface Scope {
  type: "department" | "faculty";
  id: string;
  name: string;
}

export interface User {
  id: string;
  /** backend `login_id` */
  username: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: RoleOrUnknown;
  active: boolean;
  scope?: Scope | null;
}

// Same shape as progres-modules/src/types/common.ts
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScopeOption {
  id: string;
  name: string;
  type: "department" | "faculty";
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ---------------------------------------------------------------- admissions (student side)
// Status / document vocabularies and field names are the ones used by the registrar UI
// (progres-modules/src/modules/admissions/types.ts) so both sides read the same payloads.

export type ApplicationStatus = "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "needs_correction";
export type DocumentStatus = "pending" | "valid" | "invalid" | "incomplete" | "missing";
export type DocumentType = "identity" | "baccalaureate" | "birth_certificate" | "photo" | "residence" | "transcript";
export const DOCUMENT_TYPES: DocumentType[] = ["identity", "baccalaureate", "birth_certificate", "photo", "residence", "transcript"];

export interface StudentIdentity {
  firstName: string;
  lastName: string;
  sex: "M" | "F" | "";
  birthDate: string;
  birthPlace: string;
  nationality: string;
  phone: string;
  address: string;
}

export interface AcademicBackground {
  baccalaureateYear: number | null;
  baccalaureateStream: string;
  baccalaureateAverage: number | null;
  previousInstitution?: string;
  previousDegree?: string;
}

export interface ApplicationInput {
  programId: string;
  student: StudentIdentity;
  academic: AcademicBackground;
}

export interface ApplicationEvent {
  id: string;
  action: "submitted" | "review_started" | "accepted" | "rejected" | "correction_requested" | "resubmitted" | "document_reviewed";
  actor: string;
  at: string;
  comment?: string;
}

export interface Application extends ApplicationInput {
  id: string;
  reference?: string;
  status: ApplicationStatus;
  academicYear: string;
  programName?: string;
  programNameAr?: string;
  updatedAt: string;
  /** latest registrar comment (rejection reason / correction request) */
  decisionComment?: string;
  history?: ApplicationEvent[];
}

export interface Program {
  id: string;
  name: string;
  nameAr?: string;
}

export interface ApplicationDocument {
  id: string;
  type: DocumentType;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  uploadedAt: string | null;
  status: DocumentStatus;
  reviewComment?: string;
}

export interface Eligibility {
  eligible: boolean;
  reason?: string | null;
  academicYear: string;
  level: string;
  alreadyEnrolled: boolean;
}
