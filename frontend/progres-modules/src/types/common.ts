export type Lang = 'fr' | 'ar';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDir;
}

/** Standard list query sent to every list endpoint (`GET ...?page=1&pageSize=10&sort=name&dir=asc&q=...`). */
export interface ListParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: SortDir;
  q?: string;
  [filter: string]: string | number | boolean | undefined;
}

export type AcademicLevel = 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
export const ACADEMIC_LEVELS: AcademicLevel[] = ['L1', 'L2', 'L3', 'M1', 'M2'];
export type Cycle = 'licence' | 'master';

/** "2026/2027" */
export type AcademicYear = string;

export interface Bilingual {
  name: string;
  nameAr?: string;
}

export interface Option {
  value: string;
  label: string;
}

export type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'orange' | 'cyan' | 'pink';

export interface ApiMessage {
  message: string;
}

export interface UserSummary {
  id: string;
  name: string;
  role?: string;
}
