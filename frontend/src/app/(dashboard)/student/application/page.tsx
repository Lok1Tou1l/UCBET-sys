"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorState, Field, Input, PageTitle, Select, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { admissionsApi } from "@/features/admissions/api";
import { StatusBadge } from "@/features/admissions/status-badge";
import { useApi } from "@/hooks/use-api";
import { errorMessage, fieldErrors } from "@/lib/utils/errors";
import { useI18n } from "@/providers/i18n-provider";
import type { ApplicationInput } from "@/types";

const EMPTY: ApplicationInput = {
  programId: "",
  student: { firstName: "", lastName: "", sex: "", birthDate: "", birthPlace: "", nationality: "", phone: "", address: "" },
  academic: { baccalaureateYear: null, baccalaureateStream: "", baccalaureateAverage: null, previousInstitution: "", previousDegree: "" },
};

function ApplicationContent() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const app = useApi((s) => admissionsApi.getApplication(s));
  const programs = useApi((s) => admissionsApi.programs(s));
  const [form, setForm] = useState<ApplicationInput>(EMPTY);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    if (app.data) setForm({ programId: app.data.programId, student: app.data.student, academic: app.data.academic });
  }, [app.data]);

  const status = app.data?.status;
  const editable = !status || status === "draft" || status === "needs_correction";

  const setStudent = <K extends keyof ApplicationInput["student"]>(k: K, v: ApplicationInput["student"][K]) =>
    setForm((f) => ({ ...f, student: { ...f.student, [k]: v } }));
  const setAcademic = <K extends keyof ApplicationInput["academic"]>(k: K, v: ApplicationInput["academic"][K]) =>
    setForm((f) => ({ ...f, academic: { ...f.academic, [k]: v } }));

  function validate(): boolean {
    const e: Record<string, string> = {};
    const req = t("validation.required");
    const { student: s, academic: a } = form;
    if (!s.firstName.trim()) e.firstName = req;
    if (!s.lastName.trim()) e.lastName = req;
    if (!s.sex) e.sex = req;
    if (!s.birthDate) e.birthDate = req;
    if (!s.birthPlace.trim()) e.birthPlace = req;
    if (!s.nationality.trim()) e.nationality = req;
    if (!s.phone.trim()) e.phone = req;
    if (!s.address.trim()) e.address = req;
    if (!a.baccalaureateStream.trim()) e.baccalaureateStream = req;
    if (a.baccalaureateYear === null) e.baccalaureateYear = req;
    else if (!Number.isInteger(a.baccalaureateYear) || a.baccalaureateYear < 1980 || a.baccalaureateYear > new Date().getFullYear()) e.baccalaureateYear = t("validation.number");
    if (a.baccalaureateAverage === null) e.baccalaureateAverage = req;
    else if (a.baccalaureateAverage < 0 || a.baccalaureateAverage > 20) e.baccalaureateAverage = t("validation.number");
    if (!form.programId) e.programId = req;
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function onSave(kind: "draft" | "submit") {
    // A draft can be saved incomplete; a submission must be complete.
    if (kind === "submit" && !validate()) return;
    setBusy(kind);
    try {
      await admissionsApi.saveDraft(form);
      if (kind === "submit") {
        await admissionsApi.submit();
        toast.success(t("stu.submitted"));
      } else {
        toast.success(t("toast.saved"));
      }
      app.reload();
    } catch (err) {
      // map backend per-field errors (e.g. "student.phone") back onto the form
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) setErrs(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k.split(".").pop() as string, v])));
      toast.error(errorMessage(err, t));
    } finally {
      setBusy(null);
    }
  }

  const num = (v: string) => (v === "" ? null : Number(v));
  const { student: s, academic: a } = form;

  return (
    <>
      <PageTitle subtitle={app.data?.reference ? `${t("stu.reference")}: ${app.data.reference}` : undefined}>{t("stu.appTitle")}</PageTitle>
      <Card actions={status ? <StatusBadge status={status} /> : undefined} title={app.data ? `${t("common.academicYear")}: ${app.data.academicYear}` : undefined}>
        {app.loading || programs.loading ? (
          <SkeletonList rows={5} />
        ) : app.error ? (
          <ErrorState error={app.error} onRetry={app.reload} />
        ) : programs.error ? (
          <ErrorState error={programs.error} onRetry={programs.reload} />
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6" noValidate>
            {!editable && <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">{t("stu.lockedForm")}</p>}
            {status === "needs_correction" && app.data?.decisionComment && (
              <p className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
                <strong>{t("stu.reviewerNote")}: </strong>
                {app.data.decisionComment}
              </p>
            )}

            <fieldset disabled={!editable} className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-bold text-navy-900">{t("stu.sectionIdentity")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("stu.firstName")} required error={errs.firstName}>
                    <Input value={s.firstName} onChange={(e) => setStudent("firstName", e.target.value)} />
                  </Field>
                  <Field label={t("stu.lastName")} required error={errs.lastName}>
                    <Input value={s.lastName} onChange={(e) => setStudent("lastName", e.target.value)} />
                  </Field>
                  <Field label={t("stu.sex")} required error={errs.sex}>
                    <Select value={s.sex} onChange={(e) => setStudent("sex", e.target.value as "M" | "F" | "")}>
                      <option value="">{t("common.choose")}</option>
                      <option value="M">{t("stu.sexM")}</option>
                      <option value="F">{t("stu.sexF")}</option>
                    </Select>
                  </Field>
                  <Field label={t("stu.nationality")} required error={errs.nationality}>
                    <Input value={s.nationality} onChange={(e) => setStudent("nationality", e.target.value)} />
                  </Field>
                  <Field label={t("stu.birthDate")} required error={errs.birthDate}>
                    <Input type="date" value={s.birthDate} onChange={(e) => setStudent("birthDate", e.target.value)} />
                  </Field>
                  <Field label={t("stu.birthPlace")} required error={errs.birthPlace}>
                    <Input value={s.birthPlace} onChange={(e) => setStudent("birthPlace", e.target.value)} />
                  </Field>
                  <Field label={t("common.phone")} required error={errs.phone}>
                    <Input type="tel" dir="ltr" value={s.phone} onChange={(e) => setStudent("phone", e.target.value)} />
                  </Field>
                  <Field label={t("common.address")} required error={errs.address}>
                    <Input value={s.address} onChange={(e) => setStudent("address", e.target.value)} />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-navy-900">{t("stu.sectionAcademic")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("stu.bacYear")} required error={errs.baccalaureateYear}>
                    <Input type="number" value={a.baccalaureateYear ?? ""} onChange={(e) => setAcademic("baccalaureateYear", num(e.target.value))} />
                  </Field>
                  <Field label={t("stu.bacStream")} required error={errs.baccalaureateStream}>
                    <Input value={a.baccalaureateStream} onChange={(e) => setAcademic("baccalaureateStream", e.target.value)} />
                  </Field>
                  <Field label={t("stu.bacAverage")} required error={errs.baccalaureateAverage}>
                    <Input type="number" step="0.01" value={a.baccalaureateAverage ?? ""} onChange={(e) => setAcademic("baccalaureateAverage", num(e.target.value))} />
                  </Field>
                  <Field label={t("common.program")} required error={errs.programId}>
                    <Select value={form.programId} onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value }))}>
                      <option value="">{t("common.choose")}</option>
                      {(programs.data ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {lang === "ar" && p.nameAr ? p.nameAr : p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("stu.previousInstitution")}>
                    <Input value={a.previousInstitution ?? ""} onChange={(e) => setAcademic("previousInstitution", e.target.value)} />
                  </Field>
                  <Field label={t("stu.previousDegree")}>
                    <Input value={a.previousDegree ?? ""} onChange={(e) => setAcademic("previousDegree", e.target.value)} />
                  </Field>
                </div>
              </div>
            </fieldset>

            {editable && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" loading={busy === "draft"} disabled={busy === "submit"} onClick={() => onSave("draft")}>
                  {t("stu.saveDraft")}
                </Button>
                <Button loading={busy === "submit"} disabled={busy === "draft"} onClick={() => onSave("submit")}>
                  {status === "needs_correction" ? t("stu.resubmit") : t("action.submit")}
                </Button>
              </div>
            )}
          </form>
        )}
      </Card>
    </>
  );
}

export default function ApplicationPage() {
  return (
    <RoleGuard roles={["student"]}>
      <ApplicationContent />
    </RoleGuard>
  );
}
