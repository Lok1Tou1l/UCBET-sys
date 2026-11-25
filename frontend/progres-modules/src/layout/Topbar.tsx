import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronDown, Globe, Menu, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { ROLES, useAuth } from '@/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { footerItems, homeItem, navSections } from './navigation';

function useClickOutside(ref: React.RefObject<HTMLElement>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

function FeatureSearch() {
  const { t } = useI18n();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const results = useMemo(() => {
    const all = [homeItem, ...navSections.filter((s) => can(s.permission)).flatMap((s) => s.items.map((i) => ({ ...i, section: t(s.titleKey) }))), ...footerItems];
    const n = q.trim().toLowerCase();
    return all.filter((i) => !n || t(i.labelKey).toLowerCase().includes(n) || ('section' in i && String((i as any).section).toLowerCase().includes(n))).slice(0, 8);
  }, [q, can, t]);

  return (
    <div ref={ref} className="relative hidden max-w-xl flex-1 md:block">
      <Search className="pointer-events-none absolute start-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" size={18} />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) {
            navigate(results[0].to);
            setOpen(false);
            setQ('');
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.searchPlaceholder')}
        className="h-11 w-full rounded-full border border-transparent bg-slate-100 ps-11 pe-4 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-80 animate-scale-in overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-pop">
          {results.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-500">{t('nav.noMatch')}</p>}
          {results.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.to}
                onClick={() => {
                  navigate(r.to);
                  setOpen(false);
                  setQ('');
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm hover:bg-brand-50"
              >
                <Icon className="h-4 w-4 text-brand-600" />
                <span className="font-medium text-slate-700">{t(r.labelKey)}</span>
                {'section' in r && <span className="ms-auto text-xs text-slate-400">{String((r as any).section)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Flag({ lang }: { lang: 'fr' | 'ar' }) {
  return lang === 'fr' ? (
    <svg width="24" height="17" viewBox="0 0 3 2" className="rounded-[3px] shadow-sm ring-1 ring-black/5" aria-hidden><rect width="1" height="2" fill="#1d4ed8" /><rect x="1" width="1" height="2" fill="#fff" /><rect x="2" width="1" height="2" fill="#ef4444" /></svg>
  ) : (
    <svg width="24" height="17" viewBox="0 0 3 2" className="rounded-[3px] shadow-sm ring-1 ring-black/5" aria-hidden><rect width="3" height="2" fill="#15803d" /><circle cx="1.5" cy="1" r=".5" fill="#fff" /><circle cx="1.62" cy="1" r=".4" fill="#15803d" /><path d="M1.75 .85l.1.2.2.03-.15.15.04.22-.19-.1-.19.1.04-.22-.15-.15.22-.03z" fill="#ef4444" /></svg>
  );
}

function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const langs = [
    { id: 'fr' as const, label: 'Français', short: 'FR' },
    { id: 'ar' as const, label: 'العربية', short: 'AR' },
  ];
  const cur = langs.find((l) => l.id === lang)!;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={t('topbar.language')} aria-haspopup="listbox" aria-expanded={open} className="flex h-11 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200/70">
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
              className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-brand-50', l.id === lang ? 'text-brand-700' : 'text-slate-700')}
            >
              <span className="flex items-center gap-2"><Flag lang={l.id} />{l.label}</span>
              {l.id === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const demoNotifications = [
  { id: 1, fr: 'Nouvelle candidature à examiner', ar: 'ترشيح جديد في انتظار المراجعة', to: '/admissions/applications' },
  { id: 2, fr: 'Projet de rénovation mis à jour', ar: 'تم تحديث مشروع تجديد', to: '/renovation/projects' },
  { id: 3, fr: 'Maquette L3 Informatique modifiée', ar: 'تم تعديل برنامج ليسانس إعلام آلي', to: '/records/structure/programs' },
];

function Notifications() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(demoNotifications.length);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={t('topbar.notifications')} className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute end-1.5 top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-40 mt-2 w-80 max-w-[85vw] animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-navy-900">{t('topbar.notifications')}</p>
            {unread > 0 && (
              <button onClick={() => setUnread(0)} className="text-xs font-semibold text-brand-600 hover:underline">
                {t('topbar.markAllRead')}
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto p-1.5">
            {demoNotifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    navigate(n.to);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-slate-50"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unread > 0 ? 'bg-brand-500' : 'bg-slate-300')} />
                  <span className="text-sm text-slate-700">{lang === 'ar' ? n.ar : n.fr}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useI18n();
  const { user, role, setRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-3 rounded-full py-1 ps-1 pe-2 transition hover:bg-slate-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">{user.initials}</span>
        <span className="hidden text-start leading-tight md:block">
          <span className="block text-sm font-bold text-navy-900">{user.name}</span>
          <span className="block text-xs text-slate-500">{t(`role.${role}`)}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-40 mt-2 w-72 animate-scale-in rounded-2xl border border-slate-200 bg-white p-2 shadow-pop">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={user.name} size="lg" />
            <div>
              <p className="text-sm font-bold text-navy-900">{user.name}</p>
              <p className="text-xs text-slate-500">{t(`role.${role}`)}</p>
            </div>
          </div>
          <div className="mt-1 border-t border-slate-100 px-2 pt-2">
            <p className="flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 rtl:tracking-normal">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('topbar.demoRole')}
            </p>
            <p className="mb-1 px-1 text-xs text-slate-400">{t('topbar.demoRoleHint')}</p>
            {ROLES.map((r) => (
              <button
                key={r}
                role="menuitemradio"
                aria-checked={r === role}
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                }}
                className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-brand-50', r === role ? 'font-bold text-brand-700' : 'text-slate-700')}
              >
                {t(`role.${r}`)}
                {r === role && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:px-8">
      <button onClick={onMenu} aria-label={t('nav.openMenu')} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
        <Menu className="h-6 w-6" />
      </button>
      <FeatureSearch />
      <div className="ms-auto flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
}
