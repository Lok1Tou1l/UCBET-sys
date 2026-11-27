"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { footerItems, homeItem, sectionsForRole, type NavItem } from "./nav-config";

function Item({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-4 px-6 py-[9px] text-[15px] font-medium transition-colors duration-150",
        active ? "rounded-e-xl bg-brand-600 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const sections = sectionsForRole(user?.role ?? "unknown");

  return (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <GraduationCap className="h-7 w-7" />
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight">{t("app.name")}</p>
          <p className="text-xs text-navy-200">{t("app.tagline")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto py-3 pe-2" aria-label="main">
        <Item item={homeItem} onNavigate={onNavigate} />
        {sections.map((s) => (
          <div key={s.id}>
            <p className="mb-1 px-6 text-[15.5px] font-bold text-white/95">{t(s.titleKey)}</p>
            <div className="space-y-0.5">
              {s.items.map((it) => (
                <Item key={it.to} item={it} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 py-3 pe-2">
        {footerItems.map((it) => (
          <Item key={it.to} item={it} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
