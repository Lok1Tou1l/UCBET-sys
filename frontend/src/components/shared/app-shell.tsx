"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/providers/i18n-provider";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// Layout metrics (270px sidebar, 76px topbar, #f0f4fd page) match progres-modules/src/layout/AppLayout.tsx.
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <aside className={`fixed inset-y-0 start-0 z-40 hidden w-[270px] transition-transform duration-300 lg:block ${collapsed ? "-translate-x-full rtl:translate-x-full" : ""}`}>
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[280px] animate-slide-in-start rtl:animate-slide-in-end" aria-label={t("nav.openMenu")}>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ${collapsed ? "" : "lg:ps-[270px]"}`}>
        <Topbar onMenu={() => (window.matchMedia("(min-width: 1024px)").matches ? setCollapsed((c) => !c) : setMobileOpen(true))} />
        <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
