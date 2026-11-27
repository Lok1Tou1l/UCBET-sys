"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";

export function ForbiddenView() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="mb-2 text-2xl font-extrabold text-navy-900">{t("state.forbidden")}</h1>
      <p className="mb-6 text-slate-500">{t("state.forbiddenHint")}</p>
      <Link href="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        {t("state.backHome")}
      </Link>
    </div>
  );
}
