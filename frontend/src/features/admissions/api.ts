import { ApiError, request, requestBlob } from "@/lib/api/client";
import type { Application, ApplicationDocument, ApplicationInput, DocumentType, Eligibility, Program } from "@/types";

// Student-side endpoints live under /admissions/me/* so they never collide with the registrar-side
// contract already used by progres-modules (/admissions/applications, /admissions/registrations, ...).
const ME = "/admissions/me";

export const admissionsApi = {
  // Resolves to null when the student has no application yet (HTTP 404).
  async getApplication(signal?: AbortSignal): Promise<Application | null> {
    try {
      return await request<Application>(`${ME}/application`, { signal });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  saveDraft: (data: ApplicationInput) => request<Application>(`${ME}/application`, { method: "PUT", body: data }),
  submit: () => request<Application>(`${ME}/application/submit`, { method: "POST" }),
  programs: (signal?: AbortSignal) => request<Program[]>("/admissions/programs", { signal }),

  documents: (signal?: AbortSignal) => request<ApplicationDocument[]>(`${ME}/documents`, { signal }),
  uploadDocument: (type: DocumentType, file: File) => {
    const form = new FormData();
    form.append("type", type);
    form.append("file", file);
    return request<ApplicationDocument>(`${ME}/documents`, { method: "POST", form });
  },
  replaceDocument: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ApplicationDocument>(`${ME}/documents/${encodeURIComponent(id)}`, { method: "PUT", form });
  },
  deleteDocument: (id: string) => request<void>(`${ME}/documents/${encodeURIComponent(id)}`, { method: "DELETE" }),
  documentFile: (id: string) => requestBlob(`${ME}/documents/${encodeURIComponent(id)}/file`),

  certificate: () => requestBlob(`${ME}/certificate`),

  eligibility: (signal?: AbortSignal) => request<Eligibility>(`${ME}/re-enrollment/eligibility`, { signal }),
  confirmReEnrollment: () => request<void>(`${ME}/re-enrollment`, { method: "POST" }),
};
