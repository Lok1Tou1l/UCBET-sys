import type { AcademicLevel, Paginated } from '@/types/common';

/** Draft → Submitted → Under Review → Accepted / Rejected / Needs Correction */
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'needs_correction';
export const REGISTRAR_STATUSES: ApplicationStatus[] = ['submitted', 'under_review', 'accepted', 'rejected', 'needs_correction'];

export type DocumentStatus = 'pending' | 'valid' | 'invalid' | 'incomplete' | 'missing';
export type DocumentType = 'identity' | 'baccalaureate' | 'birth_certificate' | 'photo' | 'residence' | 'transcript';

export interface DocCompletion {
  required: number;
  uploaded: number;
  verified: number;
}

export interface ApplicationListItem {
  id: string;
  reference: string;
  studentName: string;
  studentId: string;
  email: string;
  academicYear: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  level: AcademicLevel;
  specialty: string;
  specialtyAr?: string;
  submittedAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  completion: DocCompletion;
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
  reviewedBy?: string;
  reviewedAt?: string;
  /** URL the preview / download uses (served by the backend file endpoint) */
  url: string | null;
}

export interface ApplicationEvent {
  id: string;
  action: 'submitted' | 'review_started' | 'accepted' | 'rejected' | 'correction_requested' | 'resubmitted' | 'document_reviewed';
  actor: string;
  at: string;
  comment?: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  student: {
    firstName: string;
    lastName: string;
    sex: 'M' | 'F';
    birthDate: string;
    birthPlace: string;
    nationality: string;
    phone: string;
    address: string;
  };
  academic: {
    baccalaureateYear: number;
    baccalaureateStream: string;
    baccalaureateAverage: number;
    previousInstitution?: string;
    previousDegree?: string;
    choiceRank: number;
  };
  documents: ApplicationDocument[];
  history: ApplicationEvent[];
  /** latest registrar comment (rejection reason / correction request) */
  decisionComment?: string;
  submission: { channel: string; ip?: string };
}

export interface ApplicationFilters {
  academicYears: string[];
  programs: { id: string; name: string; nameAr?: string; level: AcademicLevel }[];
}

export type DecisionKind = 'accept' | 'reject' | 'request_correction' | 'start_review';

export interface DecisionRecord {
  id: string;
  applicationId: string;
  reference: string;
  studentName: string;
  studentId: string;
  programName: string;
  programNameAr?: string;
  level: AcademicLevel;
  decision: DecisionKind;
  comment?: string;
  actor: string;
  at: string;
}

export type EnrollmentStatus = 'enrolled' | 'pending_payment' | 'suspended' | 'withdrawn';

export interface Registration {
  id: string;
  applicationId: string;
  studentName: string;
  studentId: string;
  email: string;
  programId: string;
  programName: string;
  programNameAr?: string;
  level: AcademicLevel;
  specialty: string;
  specialtyAr?: string;
  academicYear: string;
  registeredAt: string;
  enrollmentStatus: EnrollmentStatus;
  certificateAvailable: boolean;
}

export interface AdmissionsDashboard {
  totals: { total: number; submitted: number; underReview: number; accepted: number; rejected: number; needsCorrection: number };
  trend: { month: string; submitted: number; accepted: number }[];
  byLevel: { level: AcademicLevel; count: number }[];
  recentApplications: ApplicationListItem[];
  recentActions: DecisionRecord[];
}

export type ApplicationPage = Paginated<ApplicationListItem>;
