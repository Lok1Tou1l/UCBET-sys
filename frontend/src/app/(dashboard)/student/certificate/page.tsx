"use client";

import { useState } from "react";
import { Button, Card, EmptyState, ErrorState, PageTitle, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { admissionsApi } from "@/features/admissions/api";
import { StatusBadge } from "@/features/admissions/status-badge";
import { useApi } from "@/hooks/use-api";
import { useI18n } from "@/providers/i18n-provider";
import { errorMessage } from "@/lib/utils/errors";
import { saveBlob } from "@/lib/api/client";

function CertificateContent() {
  const { t } = useI18n();
  const toast = useToast();
  const { data, error, loading, reload } = useApi((s) => admissionsApi.getApplication(s));
  const [busy, setBusy] = useState(false);

  async function onDownload() {
    setBusy(true);
    try {
      const blob = await admissionsApi.certificate();
      saveBlob(blob, "certificat-inscription.pdf");
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <SkeletonList rows={2} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data || data.status !== "accepted")
    return (
      <EmptyState
        message={t("stu.certNotReady")}
        action={data ? <StatusBadge status={data.status} /> : undefined}
      />
    );

  return (
    <Card>
      <p className="mb-4 text-sm text-slate-500">{t("stu.certHint")}</p>
      <Button onClick={onDownload} loading={busy}>
        {t("action.download")} PDF
      </Button>
    </Card>
  );
}

export default function CertificatePage() {
  const { t } = useI18n();
  return (
    <RoleGuard roles={["student"]}>
      <PageTitle>{t("stu.certTitle")}</PageTitle>
      <CertificateContent />
    </RoleGuard>
  );
}
