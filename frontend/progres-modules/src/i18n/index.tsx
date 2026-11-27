import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '@/types/common';
import type { Dict } from './types';
import { commonAr, commonFr } from './locales/common';
import { admissionsAr, admissionsFr } from './locales/admissions';
import { recordsAr, recordsFr } from './locales/records';
import { renovationAr, renovationFr } from './locales/renovation';

const dictionaries: Record<Lang, Dict> = {
  fr: { ...commonFr, ...admissionsFr, ...recordsFr, ...renovationFr },
  ar: { ...commonAr, ...admissionsAr, ...recordsAr, ...renovationAr },
};

const LOCALES: Record<Lang, string> = { fr: 'fr-FR', ar: 'ar-DZ' };

type Vars = Record<string, string | number>;

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  setLang: (l: Lang) => void;
  /** Translate a key. Falls back to French, then to the key itself. `{var}` placeholders are interpolated. */
  t: (key: string, vars?: Vars) => string;
  /** Pick the Arabic name when the UI is Arabic and one exists. */
  loc: (fr: string | undefined | null, ar?: string | null) => string;
  formatDate: (iso?: string | null, opts?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (iso?: string | null) => string;
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => string;
  formatPercent: (n: number, digits?: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  const saved = localStorage.getItem('progres_lang');
  return saved === 'ar' || saved === 'fr' ? saved : 'fr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('progres_lang', lang);
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const value = useMemo<I18nValue>(() => {
    const locale = LOCALES[lang];
    const t = (key: string, vars?: Vars) => {
      let s = dictionaries[lang][key] ?? dictionaries.fr[key];
      if (s === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    };
    return {
      lang,
      dir,
      isRtl: dir === 'rtl',
      setLang,
      t,
      loc: (fr, ar) => (lang === 'ar' && ar ? ar : fr ?? ''),
      formatDate: (iso, opts) => (iso ? new Intl.DateTimeFormat(locale, opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '—'),
      formatDateTime: (iso) =>
        iso ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '—',
      formatNumber: (n, opts) => new Intl.NumberFormat(locale, opts).format(n),
      formatPercent: (n, digits = 0) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n)}%`,
    };
  }, [lang, dir, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
