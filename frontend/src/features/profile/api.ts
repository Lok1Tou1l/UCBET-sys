import { request } from "@/lib/api/client";
import type { User } from "@/types";

export const profileApi = {
  get: (signal?: AbortSignal) => request<User>("/users/me", { signal }),
  update: (data: { fullName: string; email: string; phone: string }) =>
    request<User>("/users/me", { method: "PUT", body: data }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/users/me/password", { method: "POST", body: { currentPassword, newPassword } }),
};
