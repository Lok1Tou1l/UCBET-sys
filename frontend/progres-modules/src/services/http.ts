import axios, { AxiosError } from 'axios';
import { mockAdapter } from '@/mocks/server';
import '@/mocks/handlers';

/**
 * Single axios instance used by every service file.
 *
 *  - VITE_USE_MOCK !== 'false'  -> the in-browser mock server answers (see src/mocks).
 *  - VITE_USE_MOCK === 'false'  -> requests are sent to VITE_API_BASE_URL (real backend).
 *
 * Swapping to the real backend therefore requires NO change in any service or page.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('progres_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = localStorage.getItem('progres_lang') || 'fr';
  return config;
});

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(message: string, status = 0, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string; errors?: Record<string, string> }>) => {
    const status = error.response?.status ?? 0;
    const message = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new ApiError(message, status, error.response?.data?.errors));
  },
);

export function getErrorMessage(err: unknown, fallback = 'Une erreur est survenue'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export const isForbidden = (err: unknown) => err instanceof ApiError && err.status === 403;
