"use client";

import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="mb-2 text-2xl font-bold">{t("state.notFound")}</h1>
      <p className="mb-6 text-slate-500">{t("state.notFoundHint")}</p>
      <Link href="/dashboard" className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white">
        {t("state.backHome")}
      </Link>
    </div>
  );
}
