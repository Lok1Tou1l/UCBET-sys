"use client";

import { useState } from "react";
import { Button, Card, ErrorState, PageTitle, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { admissionsApi } from "@/features/admissions/api";
import { useApi } from "@/hooks/use-api";
import { useI18n } from "@/providers/i18n-provider";
import { errorMessage } from "@/lib/utils/errors";

function ReEnrollmentContent() {
  const { t } = useI18n();
  const toast = useToast();
  const { data, error, loading, reload } = useApi((s) => admissionsApi.eligibility(s));
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    setBusy(true);
    try {
      await admissionsApi.confirmReEnrollment();
      toast.success(t("stu.reenrolled"));
      reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <SkeletonList rows={2} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <Card title={`${t("common.academicYear")}: ${data.academicYear}`}>
      <p className="mb-4 text-sm">
        {t("common.level")}: <strong>{data.level}</strong>
      </p>
      {data.alreadyEnrolled ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{t("stu.alreadyEnrolled")}</p>
      ) : data.eligible ? (
        <Button onClick={onConfirm} loading={busy}>
          {t("stu.confirmReenroll")}
        </Button>
      ) : (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
          <strong>{t("stu.notEligible")}</strong>
          {data.reason && <p className="mt-1">{data.reason}</p>}
        </div>
      )}
    </Card>
  );
}

export default function ReEnrollmentPage() {
  const { t } = useI18n();
  return (
    <RoleGuard roles={["student"]}>
      <PageTitle>{t("stu.reTitle")}</PageTitle>
      <ReEnrollmentContent />
    </RoleGuard>
  );
}
