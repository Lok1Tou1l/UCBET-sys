"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { errorMessage, fieldErrors } from "@/lib/utils/errors";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const { login, status } = useAuth();
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ loginId?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!loginId.trim()) next.loginId = t("validation.required");
    if (!password) next.password = t("validation.required");
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await login(loginId.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setFormError(t("auth.failed"));
      else {
        // backend validation errors are keyed by the API field names (login_id / password)
        const fe = fieldErrors(err);
        if (fe.login_id || fe.password) setErrors({ loginId: fe.login_id, password: fe.password });
        else setFormError(errorMessage(err, t));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,520px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-9 w-9" />
          <span className="text-2xl font-extrabold tracking-tight">{t("app.name")}</span>
        </div>
        <div className="max-w-md">
          <h2 className="mb-3 text-3xl font-extrabold leading-tight">{t("app.tagline")}</h2>
          <p className="text-navy-200">{t("auth.subtitle")}</p>
        </div>
        <svg viewBox="0 0 220 90" className="h-auto w-full max-w-sm text-white/15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M10 86h200M30 86V52h160v34M50 52v34M80 52v34M110 52v34M140 52v34M170 52v34" />
          <path d="M20 52 110 22l90 30M95 40l15-10 15 10M110 22V8m0 0 10 4-10 4" />
          <rect x="96" y="62" width="28" height="24" rx="2" />
        </svg>
      </aside>

      <main className="flex flex-col justify-center bg-white px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xl font-extrabold text-navy-900 lg:invisible">
              <GraduationCap className="h-6 w-6 text-brand-600" />
              {t("app.name")}
            </span>
            <button
              onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70"
            >
              {lang === "ar" ? "Français" : "العربية"}
            </button>
          </div>

          <h1 className="text-2xl font-extrabold text-navy-900">{t("auth.title")}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{t("auth.subtitle")}</p>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label={t("auth.loginId")} error={errors.loginId}>
              <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" autoFocus maxLength={30} />
            </Field>
            <Field label={t("auth.password")} error={errors.password}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={128} />
            </Field>
            {formError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {formError}
              </p>
            )}
            <Button type="submit" size="lg" loading={busy} className="w-full">
              {t("auth.signIn")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
