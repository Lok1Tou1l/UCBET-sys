import { ApiError } from '@/services/http';
export const isApiNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
