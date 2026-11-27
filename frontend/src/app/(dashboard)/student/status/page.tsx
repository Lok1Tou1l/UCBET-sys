"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Card, EmptyState, ErrorState, PageTitle, SkeletonList } from "@/components/ui";
import { RoleGuard } from "@/features/auth/guards";
import { admissionsApi } from "@/features/admissions/api";
import { applicationStatusKey } from "@/features/admissions/status";
import { StatusBadge } from "@/features/admissions/status-badge";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/providers/i18n-provider";
import type { ApplicationStatus } from "@/types";

const FLOW: ApplicationStatus[] = ["draft", "submitted", "under_review"];

function StatusContent() {
  const { t, lang, formatDateTime } = useI18n();
  const { data, error, loading, reload } = useApi((s) => admissionsApi.getApplication(s));

  if (loading) return <SkeletonList rows={3} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data)
    return (
      <EmptyState
        message={t("stu.noApplication")}
        action={
          <Link href="/student/application" className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {t("stu.startApplication")}
          </Link>
        }
      />
    );

  // The last step depends on the outcome chosen by the registrar.
  const last: ApplicationStatus = data.status === "rejected" || data.status === "needs_correction" ? data.status : "accepted";
  const steps = [...FLOW, last];
  const currentIndex = steps.indexOf(data.status);
  const program = lang === "ar" && data.programNameAr ? data.programNameAr : data.programName;

  return (
    <div className="space-y-5">
      <Card
        actions={<StatusBadge status={data.status} />}
        title={[data.reference, program].filter(Boolean).join(" · ") || `${t("common.academicYear")}: ${data.academicYear}`}
      >
        <ol className="mb-5 grid gap-3 sm:grid-cols-4">
          {steps.map((s, i) => {
            const reached = i <= currentIndex;
            const bad = reached && (s === "rejected" || s === "needs_correction");
            return (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-sm",
                  bad ? "border-rose-300 bg-rose-50 text-rose-700" : reached ? "border-brand-300 bg-brand-50 font-semibold text-brand-700" : "border-slate-200 text-slate-400",
                )}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", bad ? "bg-rose-600 text-white" : reached ? "bg-brand-600 text-white" : "bg-slate-100")}>
                  {reached && !bad ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {t(applicationStatusKey(s))}
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-slate-500">
          {t("common.lastUpdate")}: {formatDateTime(data.updatedAt)}
        </p>
        {data.decisionComment && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <div className="mb-1 font-bold text-amber-900">{t("stu.reviewerNote")}</div>
            <p className="whitespace-pre-wrap text-amber-900/90">{data.decisionComment}</p>
          </div>
        )}
        {data.status === "needs_correction" && (
          <Link href="/student/application" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {t("stu.fixApplication")}
          </Link>
        )}
      </Card>

      {data.history && data.history.length > 0 && (
        <Card title={t("stu.history")}>
          <ol className="space-y-4 border-s-2 border-slate-200 ps-5">
            {data.history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -start-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
                <p className="text-sm font-semibold text-navy-900">{t(`adm.event.${h.action}`)}</p>
                <p className="text-xs text-slate-500">{formatDateTime(h.at)}</p>
                {h.comment && <p className="mt-1 text-sm text-slate-600">{h.comment}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

export default function StatusPage() {
  const { t } = useI18n();
  return (
    <RoleGuard roles={["student"]}>
      <PageTitle>{t("stu.trackTitle")}</PageTitle>
      <StatusContent />
    </RoleGuard>
  );
}
