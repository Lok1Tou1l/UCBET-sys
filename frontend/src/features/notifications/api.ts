import { request } from "@/lib/api/client";
import type { AppNotification } from "@/types";

export const notificationsApi = {
  list: (signal?: AbortSignal) => request<AppNotification[]>("/notifications", { signal }),
  markRead: (id: string) => request<void>(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }),
};
