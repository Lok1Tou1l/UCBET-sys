"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyState, PageTitle } from "@/components/ui";
import { sectionsForRole } from "@/components/shared/nav-config";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  if (!user) return null;
  const sections = sectionsForRole(user.role);

  return (
    <>
      <PageTitle subtitle={t("home.subtitle")}>
        {t("home.welcome")}، {user.fullName}
      </PageTitle>
      {sections.length === 0 && <EmptyState message={t("home.noAccess")} />}
      {sections.map((s) => (
        <section key={s.id} className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400 rtl:tracking-normal">{t(s.titleKey)}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {s.items.map((i) => {
              const Icon = i.icon;
              return (
                <Link
                  key={i.to}
                  href={i.to}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="flex-1 font-semibold text-navy-900">{t(i.labelKey)}</span>
                  <ArrowUpRight className="h-5 w-5 text-slate-300 rtl:-scale-x-100 group-hover:text-brand-600" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
