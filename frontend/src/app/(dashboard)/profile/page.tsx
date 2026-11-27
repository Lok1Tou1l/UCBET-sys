"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, ErrorState, Field, Input, PageTitle, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/providers/auth-provider";
import { profileApi } from "@/features/profile/api";
import { useApi } from "@/hooks/use-api";
import { useI18n } from "@/providers/i18n-provider";
import { errorMessage } from "@/lib/utils/errors";

export default function ProfilePage() {
  const { t } = useI18n();
  const toast = useToast();
  const { setUser } = useAuth();
  const { data, error, loading, reload } = useApi((s) => profileApi.get(s));

  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrs, setPwErrs] = useState<Record<string, string>>({});
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (data) setForm({ fullName: data.fullName, email: data.email, phone: data.phone ?? "" });
  }, [data]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = t("validation.required");
    if (!form.email.trim()) next.email = t("validation.required");
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t("validation.email");
    setErrs(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const updated = await profileApi.update(form);
      setUser(updated);
      toast.success(t("toast.saved"));
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!pw.current) next.current = t("validation.required");
    if (pw.next.length < 8) next.next = t("iam.passwordShort");
    if (pw.confirm !== pw.next) next.confirm = t("iam.passwordMismatch");
    setPwErrs(next);
    if (Object.keys(next).length) return;
    setPwBusy(true);
    try {
      await profileApi.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      toast.success(t("iam.passwordChanged"));
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <>
      <PageTitle>{t("iam.profileTitle")}</PageTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          {loading ? (
            <SkeletonList rows={3} />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <form onSubmit={saveProfile} className="space-y-4" noValidate>
              <Field label={t("auth.loginId")}>
                <Input value={data?.username ?? ""} disabled readOnly />
              </Field>
              <Field label={t("iam.fullName")} error={errs.fullName}>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <Field label={t("common.email")} error={errs.email}>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label={t("common.phone")}>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Button type="submit" loading={saving}>
                {t("action.save")}
              </Button>
            </form>
          )}
        </Card>

        <Card title={t("iam.changePassword")}>
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <Field label={t("iam.currentPassword")} error={pwErrs.current}>
              <Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label={t("iam.newPassword")} error={pwErrs.next} hint={t("iam.passwordShort")}>
              <Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field label={t("iam.confirmPassword")} error={pwErrs.confirm}>
              <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            <Button type="submit" loading={pwBusy}>
              {t("action.save")}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
