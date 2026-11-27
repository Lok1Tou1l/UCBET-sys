import type { Paginated } from '@/types/common';

export type ProjectStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
export const PROJECT_STATUSES: ProjectStatus[] = ['planned', 'active', 'paused', 'completed', 'cancelled'];

export type ProjectPhase = 'preparation' | 'structural' | 'finishing' | 'equipment' | 'inspection' | 'handover';
export const PROJECT_PHASES: ProjectPhase[] = ['preparation', 'structural', 'finishing', 'equipment', 'inspection', 'handover'];

export type ContractorStatus = 'active' | 'inactive' | 'suspended';
export const CONTRACTOR_STATUSES: ContractorStatus[] = ['active', 'inactive', 'suspended'];

export type DocumentCategory = 'plan' | 'contract' | 'report' | 'photo' | 'permit' | 'other';
export const DOCUMENT_CATEGORIES: DocumentCategory[] = ['plan', 'contract', 'report', 'photo', 'permit', 'other'];

export interface Contractor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  activity: string;
  registrationNumber?: string;
  foundedYear?: number;
  website?: string;
  description?: string;
  status: ContractorStatus;
  projectCount: number;
  activeProjectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  id: string;
  reference: string;
  title: string;
  description?: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: ProjectStatus;
  progress: number;
  phase: ProjectPhase;
  contractorId: string | null;
  contractorName: string | null;
  createdAt: string;
  updatedAt: string;
  lastProgressAt: string | null;
}

export interface StatusChange {
  id: string;
  from: ProjectStatus | null;
  to: ProjectStatus;
  comment?: string;
  by: string;
  at: string;
}

export interface Assignment {
  id: string;
  projectId: string;
  projectTitle: string;
  contractorId: string;
  contractorName: string;
  assignedAt: string;
  assignedBy: string;
  endedAt: string | null;
  note?: string;
  current: boolean;
}

export interface ProjectDetail extends ProjectListItem {
  notes?: string;
  contractor: Contractor | null;
  currentAssignment: Assignment | null;
  statusHistory: StatusChange[];
  /** transitions the backend accepts from the current status – the UI only offers these */
  allowedStatuses: ProjectStatus[];
  documentCount: number;
  progressUpdateCount: number;
}

export interface ProgressUpdate {
  id: string;
  projectId: string;
  projectTitle: string;
  progress: number;
  previousProgress: number | null;
  phase: ProjectPhase;
  previousPhase: ProjectPhase | null;
  status: ProjectStatus;
  previousStatus: ProjectStatus | null;
  updateDate: string;
  createdAt: string;
  note: string;
  author: { id: string; name: string };
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  projectTitle: string;
  name: string;
  category: DocumentCategory;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export interface RenovationDashboard {
  totals: { projects: number; planned: number; active: number; paused: number; completed: number; cancelled: number; contractors: number; activeContractors: number; averageProgress: number };
  byStatus: { status: ProjectStatus; count: number }[];
  progressByProject: { id: string; title: string; progress: number; status: ProjectStatus }[];
  updatesTrend: { month: string; updates: number }[];
  recentProjects: ProjectListItem[];
  recentUpdates: ProgressUpdate[];
}

export interface RenovationFilters {
  locations: string[];
  contractors: { id: string; name: string; status: ContractorStatus }[];
  projects: { id: string; title: string; status: ProjectStatus }[];
  activities: string[];
}

export interface ProjectPayload {
  title: string;
  description?: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  contractorId?: string | null;
  status: ProjectStatus;
  notes?: string;
}
export interface ContractorPayload {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  activity: string;
  registrationNumber?: string;
  foundedYear?: number | null;
  website?: string;
  description?: string;
  status: ContractorStatus;
}
export interface ProgressPayload {
  progress: number;
  phase: ProjectPhase;
  status?: ProjectStatus;
  updateDate: string;
  note: string;
}

export type ProjectPage = Paginated<ProjectListItem>;
