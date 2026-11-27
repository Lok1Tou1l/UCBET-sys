import type { Tone } from '@/types/common';
import type { ApplicationStatus, DecisionKind, DocumentStatus, EnrollmentStatus } from './types';

export const applicationStatusTone: Record<ApplicationStatus, Tone> = {
  draft: 'slate',
  submitted: 'purple',
  under_review: 'amber',
  accepted: 'green',
  rejected: 'red',
  needs_correction: 'blue',
};
export const applicationStatusKey = (s: ApplicationStatus) => `adm.status.${s}`;

export const documentStatusTone: Record<DocumentStatus, Tone> = {
  pending: 'amber',
  valid: 'green',
  invalid: 'red',
  incomplete: 'orange',
  missing: 'slate',
};
export const documentStatusKey = (s: DocumentStatus) => `adm.docStatus.${s}`;

export const decisionTone: Record<DecisionKind, Tone> = {
  accept: 'green',
  reject: 'red',
  request_correction: 'blue',
  start_review: 'amber',
};
export const decisionKey = (d: DecisionKind) => `adm.decision.${d}`;

export const enrollmentTone: Record<EnrollmentStatus, Tone> = {
  enrolled: 'green',
  pending_payment: 'amber',
  suspended: 'red',
  withdrawn: 'slate',
};
export const enrollmentKey = (s: EnrollmentStatus) => `adm.enrollment.${s}`;
