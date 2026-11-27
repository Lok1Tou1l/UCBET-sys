// Single fetch wrapper used by every feature api module.
// Contract with the backend (feature/backend-foundation): base URL = NEXT_PUBLIC_API_URL (…/api/v1),
// Bearer JWT, FastAPI errors as { detail } (string or validation list); the team's { message, errors } is also read.
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

// Same storage keys as progres-modules (src/services/http.ts, src/i18n/index.tsx)
export const TOKEN_KEY = "progres_token";
export const LANG_KEY = "progres_lang";

export class ApiError extends Error {
  status: number;
  /** field -> message, when the backend returns per-field errors */
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  /** do not trigger the global "session expired" handler on 401 (login / me) */
  skipAuthRedirect?: boolean;
}

interface ErrorBody {
  message?: string;
  detail?: string | { msg?: string; loc?: (string | number)[] }[];
  errors?: Record<string, string>;
}

function parseError(data: ErrorBody | undefined, fallback: string): { message: string; details?: Record<string, string> } {
  if (!data) return { message: fallback };
  let details = data.errors;
  let message = data.message ?? fallback;
  if (typeof data.detail === "string") message = data.detail;
  else if (Array.isArray(data.detail) && data.detail.length) {
    // FastAPI/Pydantic validation errors: [{ loc: ["body","login_id"], msg: "..." }]
    details = { ...details };
    for (const d of data.detail) {
      const field = d.loc?.filter((p) => p !== "body" && p !== "query").join(".");
      if (field && d.msg) details[field] = d.msg;
    }
    message = data.detail[0]?.msg ?? message;
  }
  return { message, details };
}

async function rawRequest(path: string, opts: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    headers["Accept-Language"] = window.localStorage.getItem(LANG_KEY) || "fr";
  } catch {
    headers["Accept-Language"] = "fr";
  }

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: opts.method ?? "GET", headers, body, signal: opts.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "NETWORK");
  }

  if (!res.ok) {
    let data: ErrorBody | undefined;
    try {
      data = await res.json();
    } catch {
      /* non-JSON error body */
    }
    const { message, details } = parseError(data, res.statusText);
    if (res.status === 401 && !opts.skipAuthRedirect) onUnauthorized?.();
    throw new ApiError(res.status, message, details);
  }
  return res;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, opts);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function requestBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const res = await rawRequest(path, { signal });
  return res.blob();
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
