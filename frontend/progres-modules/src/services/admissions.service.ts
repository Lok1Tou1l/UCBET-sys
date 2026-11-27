/**
 * Admissions & Registration – registrar-side API (backend owner: Soualem Ahmed).
 *
 * Endpoint contract used by this frontend (see README "API contracts"):
 *   GET   /admissions/dashboard
 *   GET   /admissions/filters
 *   GET   /admissions/applications                     ?q&academicYear&level&programId&status&dateFrom&dateTo&sort&dir&page&pageSize
 *   GET   /admissions/applications/:id
 *   POST  /admissions/applications/:id/start-review
 *   POST  /admissions/applications/:id/accept           { comment? }
 *   POST  /admissions/applications/:id/reject           { comment }            (comment mandatory)
 *   POST  /admissions/applications/:id/request-correction { comment, documentIds? } (comment mandatory)
 *   PATCH /admissions/applications/:id/documents/:docId { status, comment? }
 *   GET   /admissions/decisions                         ?q&decision&sort&dir&page&pageSize
 *   GET   /admissions/registrations                     ?q&academicYear&programId&level&enrollmentStatus&sort&dir&page&pageSize
 *   GET   /admissions/registrations/:id/certificate     -> application/pdf (only when certificateAvailable)
 */
import { http } from './http';
import type { ListParams, Paginated } from '@/types/common';
import type {
  AdmissionsDashboard,
  ApplicationDetail,
  ApplicationDocument,
  ApplicationFilters,
  ApplicationListItem,
  DecisionRecord,
  DocumentStatus,
  Registration,
} from '@/modules/admissions/types';

export const admissionsService = {
  dashboard: () => http.get<AdmissionsDashboard>('/admissions/dashboard').then((r) => r.data),
  filters: () => http.get<ApplicationFilters>('/admissions/filters').then((r) => r.data),

  listApplications: (params: ListParams) => http.get<Paginated<ApplicationListItem>>('/admissions/applications', { params }).then((r) => r.data),
  getApplication: (id: string) => http.get<ApplicationDetail>(`/admissions/applications/${id}`).then((r) => r.data),

  startReview: (id: string) => http.post<ApplicationDetail>(`/admissions/applications/${id}/start-review`).then((r) => r.data),
  accept: (id: string, comment?: string) => http.post<ApplicationDetail>(`/admissions/applications/${id}/accept`, { comment }).then((r) => r.data),
  reject: (id: string, comment: string) => http.post<ApplicationDetail>(`/admissions/applications/${id}/reject`, { comment }).then((r) => r.data),
  requestCorrection: (id: string, comment: string, documentIds?: string[]) =>
    http.post<ApplicationDetail>(`/admissions/applications/${id}/request-correction`, { comment, documentIds }).then((r) => r.data),

  reviewDocument: (applicationId: string, docId: string, status: DocumentStatus, comment?: string) =>
    http.patch<ApplicationDocument>(`/admissions/applications/${applicationId}/documents/${docId}`, { status, comment }).then((r) => r.data),

  listDecisions: (params: ListParams) => http.get<Paginated<DecisionRecord>>('/admissions/decisions', { params }).then((r) => r.data),

  listRegistrations: (params: ListParams) => http.get<Paginated<Registration>>('/admissions/registrations', { params }).then((r) => r.data),
  downloadCertificate: (id: string) => http.get<Blob>(`/admissions/registrations/${id}/certificate`, { responseType: 'blob' }).then((r) => r.data),
};
