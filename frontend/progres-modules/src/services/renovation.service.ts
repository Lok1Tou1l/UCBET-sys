/**
 * Renovation & Contractor Management – API (backend owner: Manar).
 *
 * Endpoint contract used by this frontend (see README "API contracts"):
 *   GET    /renovation/dashboard
 *   GET    /renovation/filters
 *   GET    /renovation/projects                       ?q&status&location&contractorId&dateFrom&dateTo&sort&dir&page&pageSize
 *   POST   /renovation/projects
 *   GET    /renovation/projects/:id                   (includes contractor, currentAssignment, statusHistory, allowedStatuses)
 *   PUT    /renovation/projects/:id
 *   PATCH  /renovation/projects/:id/status            { status, comment? }       (never overwrites history – appends a StatusChange)
 *   GET    /renovation/projects/:id/progress-updates
 *   POST   /renovation/projects/:id/progress-updates  { progress, phase, status?, updateDate, note }
 *   GET    /renovation/projects/:id/assignments       assignment history
 *   POST   /renovation/projects/:id/assignments       { contractorId, note? }    (ends the current assignment, if any)
 *   GET    /renovation/projects/:id/documents
 *   POST   /renovation/projects/:id/documents         multipart/form-data: file, category
 *   DELETE /renovation/documents/:id
 *   GET    /renovation/progress-updates               ?projectId&phase&page&pageSize      (all projects)
 *   GET    /renovation/assignments                    ?projectId&contractorId&current&page&pageSize
 *   GET    /renovation/documents                      ?q&projectId&category&page&pageSize
 *   GET    /renovation/contractors                    ?q&status&activity&sort&dir&page&pageSize
 *   POST   /renovation/contractors
 *   GET    /renovation/contractors/:id
 *   PUT    /renovation/contractors/:id
 *   PATCH  /renovation/contractors/:id/status         { status }
 */
import { http } from './http';
import type { ListParams, Paginated } from '@/types/common';
import type {
  Assignment,
  Contractor,
  ContractorPayload,
  ContractorStatus,
  DocumentCategory,
  ProgressPayload,
  ProgressUpdate,
  ProjectDetail,
  ProjectDocument,
  ProjectListItem,
  ProjectPayload,
  ProjectStatus,
  RenovationDashboard,
  RenovationFilters,
} from '@/modules/renovation/types';

export const renovationService = {
  dashboard: () => http.get<RenovationDashboard>('/renovation/dashboard').then((r) => r.data),
  filters: () => http.get<RenovationFilters>('/renovation/filters').then((r) => r.data),

  listProjects: (params: ListParams) => http.get<Paginated<ProjectListItem>>('/renovation/projects', { params }).then((r) => r.data),
  getProject: (id: string) => http.get<ProjectDetail>(`/renovation/projects/${id}`).then((r) => r.data),
  createProject: (payload: ProjectPayload) => http.post<ProjectDetail>('/renovation/projects', payload).then((r) => r.data),
  updateProject: (id: string, payload: ProjectPayload) => http.put<ProjectDetail>(`/renovation/projects/${id}`, payload).then((r) => r.data),
  updateStatus: (id: string, status: ProjectStatus, comment?: string) => http.patch<ProjectDetail>(`/renovation/projects/${id}/status`, { status, comment }).then((r) => r.data),

  listProjectProgress: (id: string) => http.get<ProgressUpdate[]>(`/renovation/projects/${id}/progress-updates`).then((r) => r.data),
  addProgress: (id: string, payload: ProgressPayload) => http.post<ProgressUpdate>(`/renovation/projects/${id}/progress-updates`, payload).then((r) => r.data),
  listProgress: (params: ListParams) => http.get<Paginated<ProgressUpdate>>('/renovation/progress-updates', { params }).then((r) => r.data),

  listProjectAssignments: (id: string) => http.get<Assignment[]>(`/renovation/projects/${id}/assignments`).then((r) => r.data),
  assign: (id: string, contractorId: string, note?: string) => http.post<Assignment>(`/renovation/projects/${id}/assignments`, { contractorId, note }).then((r) => r.data),
  listAssignments: (params: ListParams) => http.get<Paginated<Assignment>>('/renovation/assignments', { params }).then((r) => r.data),

  listProjectDocuments: (id: string) => http.get<ProjectDocument[]>(`/renovation/projects/${id}/documents`).then((r) => r.data),
  listDocuments: (params: ListParams) => http.get<Paginated<ProjectDocument>>('/renovation/documents', { params }).then((r) => r.data),
  uploadDocument: (projectId: string, file: File, category: DocumentCategory, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    return http
      .post<ProjectDocument>(`/renovation/projects/${projectId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => r.data);
  },
  deleteDocument: (id: string) => http.delete<void>(`/renovation/documents/${id}`).then(() => undefined),

  listContractors: (params: ListParams) => http.get<Paginated<Contractor>>('/renovation/contractors', { params }).then((r) => r.data),
  getContractor: (id: string) => http.get<Contractor>(`/renovation/contractors/${id}`).then((r) => r.data),
  createContractor: (payload: ContractorPayload) => http.post<Contractor>('/renovation/contractors', payload).then((r) => r.data),
  updateContractor: (id: string, payload: ContractorPayload) => http.put<Contractor>(`/renovation/contractors/${id}`, payload).then((r) => r.data),
  updateContractorStatus: (id: string, status: ContractorStatus) => http.patch<Contractor>(`/renovation/contractors/${id}/status`, { status }).then((r) => r.data),
};
