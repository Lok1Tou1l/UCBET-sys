import { request } from "@/lib/api/client";
import { normalizeRole } from "@/lib/utils/roles";
import type { User } from "@/types";

// feature/backend-foundation: POST /auth/login {login_id,password} -> {access_token,token_type}
//                             GET  /auth/me -> {id, login_id, role}
interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface MeResponse {
  id: number | string;
  login_id: string;
  role: string;
  // optional extras, used when the backend adds them
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export function toUser(raw: MeResponse): User {
  return {
    id: String(raw.id),
    username: raw.login_id,
    fullName: raw.full_name || raw.display_name || raw.login_id,
    email: raw.email ?? "",
    phone: raw.phone ?? null,
    role: normalizeRole(raw.role),
    active: raw.is_active ?? true,
  };
}

export const authApi = {
  login: (loginId: string, password: string) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: { login_id: loginId, password }, skipAuthRedirect: true }),
  me: async (signal?: AbortSignal) => toUser(await request<MeResponse>("/auth/me", { signal, skipAuthRedirect: true })),
};
