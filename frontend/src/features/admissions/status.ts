import type { Tone } from "@/components/ui";
import type { ApplicationStatus, DocumentStatus } from "@/types";

// Same tone mapping and i18n key scheme as progres-modules/src/modules/admissions/status.ts
export const applicationStatusTone: Record<ApplicationStatus, Tone> = {
  draft: "slate",
  submitted: "purple",
  under_review: "amber",
  accepted: "green",
  rejected: "red",
  needs_correction: "blue",
};
export const applicationStatusKey = (s: ApplicationStatus) => `adm.status.${s}`;

export const documentStatusTone: Record<DocumentStatus, Tone> = {
  pending: "amber",
  valid: "green",
  invalid: "red",
  incomplete: "orange",
  missing: "slate",
};
export const documentStatusKey = (s: DocumentStatus) => `adm.docStatus.${s}`;
