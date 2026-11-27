"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, PageTitle, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { notificationsApi } from "@/features/notifications/api";
import { useApi } from "@/hooks/use-api";
import { useI18n } from "@/providers/i18n-provider";
import { errorMessage } from "@/lib/utils/errors";

function NotificationsContent() {
  const { t, formatDateTime } = useI18n();
  const toast = useToast();
  const { data, error, loading, reload } = useApi((s) => notificationsApi.list(s));
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      await notificationsApi.markRead(id);
      reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState message={t("table.empty")} />
      ) : (
        <ul className="divide-y divide-line">
          {data.map((n) => (
            <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {n.title}
                  {!n.read && <Badge tone="primary">{t("stu.unread")}</Badge>}
                </div>
                <p className="text-sm text-slate-500">{n.message}</p>
                <time className="text-xs text-slate-500">{formatDateTime(n.createdAt)}</time>
              </div>
              {!n.read && (
                <Button variant="secondary" loading={busyId === n.id} onClick={() => markRead(n.id)}>
                  {t("stu.markRead")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function NotificationsPage() {
  const { t } = useI18n();
  return (
    <RoleGuard roles={["student"]}>
      <PageTitle>{t("stu.notifTitle")}</PageTitle>
      <NotificationsContent />
    </RoleGuard>
  );
}
