"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DIRECTION, INTL_LOCALE, dictionaries, type Lang } from "@/i18n/dictionaries";
import { LANG_KEY } from "@/lib/api/client";

type Vars = Record<string, string | number>;

// Same surface as progres-modules/src/i18n (lang, dir, isRtl, setLang, t, formatDate...), so components port 1:1.
interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  isRtl: boolean;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Vars) => string;
  formatDate: (iso?: string | null, opts?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (iso?: string | null) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // fr is the team default; the saved choice is applied right after hydration.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === "ar" || saved === "fr") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = DIRECTION[lang];
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const locale = INTL_LOCALE[lang];
    return {
      lang,
      dir: DIRECTION[lang],
      isRtl: lang === "ar",
      setLang,
      t: (key, vars) => {
        let s = dictionaries[lang][key] ?? dictionaries.fr[key];
        if (s === undefined) return key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
        return s;
      },
      formatDate: (iso, opts) => (iso ? new Date(iso).toLocaleDateString(locale, opts) : "—"),
      formatDateTime: (iso) => (iso ? new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "—"),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
