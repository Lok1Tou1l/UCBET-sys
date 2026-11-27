"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { Bell, Check, ChevronDown, LogOut, Menu } from "lucide-react";
import { notificationsApi } from "@/features/notifications/api";
import { cn, initials } from "@/lib/utils/cn";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import type { Lang } from "@/types";

function useClickOutside(ref: RefObject<HTMLElement>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOut]);
}

function Flag({ lang }: { lang: Lang }) {
  return lang === "fr" ? (
    <svg width="24" height="17" viewBox="0 0 3 2" className="rounded-[3px] shadow-sm ring-1 ring-black/5" aria-hidden>
      <rect width="1" height="2" fill="#1d4ed8" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ef4444" />
    </svg>
  ) : (
    <svg width="24" height="17" viewBox="0 0 3 2" className="rounded-[3px] shadow-sm ring-1 ring-black/5" aria-hidden>
      <rect width="3" height="2" fill="#15803d" />
      <circle cx="1.5" cy="1" r=".5" fill="#fff" />
      <circle cx="1.62" cy="1" r=".4" fill="#15803d" />
    </svg>
  );
}

function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const langs: { id: Lang; label: string; short: string }[] = [
    { id: "fr", label: "Français", short: "FR" },
    { id: "ar", label: "العربية", short: "AR" },
  ];
  const cur = langs.find((l) => l.id === lang)!;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("topbar.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200/70"
      >
        <Flag lang={cur.id} />
        <span className="hidden sm:inline">{cur.label}</span>
        <span className="sm:hidden">{cur.short}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div role="listbox" className="absolute end-0 top-full z-40 mt-2 w-40 animate-scale-in rounded-2xl border border-slate-200 bg-white p-1.5 shadow-pop">
          {langs.map((l) => (
            <button
              key={l.id}
              role="option"
              aria-selected={l.id === lang}
              onClick={() => {
                setLang(l.id);
                setOpen(false);
              }}
              className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-brand-50", l.id === lang ? "text-brand-700" : "text-slate-700")}
            >
              <span className="flex items-center gap-2">
                <Flag lang={l.id} />
                {l.label}
              </span>
              {l.id === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Real unread count (students only) — no placeholder data.
function NotificationsBell() {
  const { t } = useI18n();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    notificationsApi
      .list(controller.signal)
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
    return () => controller.abort();
  }, []);
  return (
    <Link href="/notifications" aria-label={t("topbar.notifications")} className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100">
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute end-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-3 rounded-full py-1 ps-1 pe-2 transition hover:bg-slate-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">{initials(user.fullName) || "?"}</span>
        <span className="hidden text-start leading-tight md:block">
          <span className="block text-sm font-bold text-navy-900">{user.fullName}</span>
          <span className="block text-xs text-slate-500">{t(`role.${user.role}`)}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-40 mt-2 w-64 animate-scale-in rounded-2xl border border-slate-200 bg-white p-2 shadow-pop">
          <div className="px-3 py-2.5">
            <p className="text-sm font-bold text-navy-900">{user.fullName}</p>
            <p className="ltr-text text-xs text-slate-500">{user.username}</p>
          </div>
          <div className="border-t border-slate-100 pt-1">
            <Link href="/profile" onClick={() => setOpen(false)} role="menuitem" className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-brand-50">
              {t("topbar.account")}
            </Link>
            <button onClick={logout} role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
              <LogOut className="h-4 w-4" />
              {t("topbar.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:px-8">
      <button onClick={onMenu} aria-label={t("nav.openMenu")} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
        <Menu className="h-6 w-6" />
      </button>
      <div className="ms-auto flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        {user?.role === "student" && <NotificationsBell />}
        <UserMenu />
      </div>
    </header>
  );
}
