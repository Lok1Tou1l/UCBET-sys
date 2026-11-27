/**
 * In-browser mock backend.
 *
 * It plugs into axios as a custom adapter, so every service performs a *real* axios call
 * (`http.get('/admissions/applications', { params })`) and the mock answers it.
 * Each handler file documents the endpoint contract the real backend is expected to follow.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

export class MockHttpError extends Error {
  status: number;
  errors?: Record<string, string>;
  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export interface MockContext {
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  config: InternalAxiosRequestConfig;
}
type Handler = (ctx: MockContext) => unknown | Promise<unknown>;
interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function compile(path: string) {
  const keys: string[] = [];
  const pattern = path.replace(/:[A-Za-z]+/g, (m) => {
    keys.push(m.slice(1));
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${pattern}/?$`), keys };
}

export const mock = {
  get: (path: string, handler: Handler) => add('get', path, handler),
  post: (path: string, handler: Handler) => add('post', path, handler),
  put: (path: string, handler: Handler) => add('put', path, handler),
  patch: (path: string, handler: Handler) => add('patch', path, handler),
  delete: (path: string, handler: Handler) => add('delete', path, handler),
};

function add(method: string, path: string, handler: Handler) {
  const { regex, keys } = compile(path);
  routes.push({ method, regex, keys, handler });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseBody(data: unknown) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(180 + Math.random() * 260);
  // simulate upload progress for multipart requests so the UI progress bar can be exercised without a backend
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.onUploadProgress) {
    for (const pct of [20, 45, 70, 100]) {
      config.onUploadProgress({ loaded: pct, total: 100 } as any);
      await delay(140);
    }
  }
  const method = (config.method ?? 'get').toLowerCase();
  let url = (config.url ?? '').split('?')[0];
  const base = config.baseURL ?? '';
  if (base && url.startsWith(base)) url = url.slice(base.length);
  if (!url.startsWith('/')) url = '/' + url;

  const fail = (status: number, message: string, errors?: Record<string, string>) => {
    const response = { data: { message, errors }, status, statusText: String(status), headers: {}, config, request: {} };
    return Promise.reject(new AxiosError(message, String(status), config, {}, response as any));
  };

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.regex.exec(url);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    try {
      const data = await r.handler({ params, query: { ...(config.params ?? {}) }, body: parseBody(config.data), config });
      return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
    } catch (e) {
      if (e instanceof MockHttpError) return fail(e.status, e.message, e.errors);
      console.error('[mock] handler crashed', e);
      return fail(500, (e as Error).message || 'Mock server error');
    }
  }
  return fail(404, `Mock endpoint not implemented: ${method.toUpperCase()} ${url}`);
};
