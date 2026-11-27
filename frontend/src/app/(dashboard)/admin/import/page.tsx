"use client";

import { useState } from "react";
import { Button, Card, Field, Input, PageTitle } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { adminApi } from "@/features/admin/api";
import { useI18n } from "@/providers/i18n-provider";
import { errorMessage } from "@/lib/utils/errors";
import type { ImportResult } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;

function ImportContent() {
  const { t } = useI18n();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  function onPick(f: File | null) {
    setResult(null);
    setApiError(null);
    setFile(null);
    if (!f) return setFileError(null);
    const looksCsv = f.name.toLowerCase().endsWith(".csv") || f.type === "text/csv" || f.type === "application/vnd.ms-excel";
    if (!looksCsv || f.size === 0) return setFileError(t("iam.csvInvalid"));
    if (f.size > MAX_BYTES) return setFileError(t("upload.tooLarge"));
    setFileError(null);
    setFile(f);
  }

  async function onUpload() {
    if (!file) return setFileError(t("validation.required"));
    setBusy(true);
    setApiError(null);
    try {
      const res = await adminApi.importCsv(file);
      setResult(res);
      toast.success(t("iam.importDone"));
    } catch (err) {
      setApiError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle>{t("iam.importTitle")}</PageTitle>
      <Card>
        <p className="mb-4 text-sm text-slate-500">{t("iam.importHint")}</p>
        <div className="max-w-md space-y-4">
          <Field label={t("iam.chooseCsv")} error={fileError ?? undefined}>
            <Input type="file" accept=".csv,text/csv" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          </Field>
          <Button onClick={onUpload} loading={busy} disabled={!file}>
            {t("action.upload")}
          </Button>
        </div>

        {apiError && (
          <p role="alert" className="mt-4 text-sm text-rose-600">
            {apiError}
          </p>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">{t("iam.importDone")}</h3>
            <p className="text-sm">
              <span className="text-emerald-600">
                {result.created} {t("iam.importCreated")}
              </span>
              {" · "}
              <span className={result.failed ? "text-rose-600" : ""}>
                {result.failed} {t("iam.importFailed")}
              </span>
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-64 space-y-1 overflow-auto rounded-xl border border-slate-200 p-3 text-sm">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    <strong>
                      {t("iam.row")} {e.row}:
                    </strong>{" "}
                    {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </>
  );
}

export default function ImportPage() {
  return (
    <RoleGuard roles={["sys_admin"]}>
      <ImportContent />
    </RoleGuard>
  );
}
