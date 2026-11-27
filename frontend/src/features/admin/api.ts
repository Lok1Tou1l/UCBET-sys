import { request } from "@/lib/api/client";
import type { ImportResult, Paginated, Role, ScopeOption, User } from "@/types";

export const adminApi = {
  listUsers: (params: { page: number; pageSize: number; q: string }, signal?: AbortSignal) => {
    const sp = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.q) sp.set("q", params.q);
    return request<Paginated<User>>(`/admin/users?${sp.toString()}`, { signal });
  },
  setActive: (id: string, active: boolean) =>
    request<User>(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: { active } }),
  setRole: (id: string, role: Role, scopeId: string | null) =>
    request<User>(`/admin/users/${encodeURIComponent(id)}/role`, { method: "PUT", body: { role, scopeId } }),
  listScopes: (signal?: AbortSignal) => request<ScopeOption[]>("/admin/scopes", { signal }),
  importCsv: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ImportResult>("/admin/users/import", { method: "POST", form });
  },
};
