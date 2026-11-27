"use client";

import { Badge } from "@/components/ui";
import { useI18n } from "@/providers/i18n-provider";
import type { ApplicationStatus } from "@/types";
import { applicationStatusKey, applicationStatusTone } from "./status";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useI18n();
  return <Badge tone={applicationStatusTone[status]}>{t(applicationStatusKey(status))}</Badge>;
}
