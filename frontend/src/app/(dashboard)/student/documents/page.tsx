"use client";

import { useRef, useState } from "react";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageTitle, Select, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { admissionsApi } from "@/features/admissions/api";
import { documentStatusKey, documentStatusTone } from "@/features/admissions/status";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/utils/errors";
import { useI18n } from "@/providers/i18n-provider";
import { DOCUMENT_TYPES, type ApplicationDocument, type DocumentType } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

function validateFile(f: File): "upload.badType" | "upload.tooLarge" | null {
  if (!ALLOWED.includes(f.type)) return "upload.badType";
  if (f.size > MAX_BYTES) return "upload.tooLarge";
  return null;
}

const fmtSize = (n: number | null) => (n === null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function DocumentsContent() {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const app = useApi((s) => admissionsApi.getApplication(s));
  const docs = useApi((s) => admissionsApi.documents(s));

  const [type, setType] = useState<DocumentType | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);

  // Documents can only change while the application is a draft or was sent back for correction.
  const status = app.data?.status;
  const locked = !!status && status !== "draft" && status !== "needs_correction";

  function onPick(f: File | null) {
    setFile(null);
    if (!f) return setFileError(null);
    const problem = validateFile(f);
    if (problem) return setFileError(t(problem));
    setFileError(null);
    setFile(f);
  }

  async function onUpload() {
    let ok = true;
    if (!type) {
      setTypeError(t("validation.required"));
      ok = false;
    } else setTypeError(null);
    if (!file) {
      setFileError(t("validation.required"));
      ok = false;
    }
    if (!ok || !file || !type) return;
    setUploading(true);
    try {
      await admissionsApi.uploadDocument(type, file);
      toast.success(t("toast.saved"));
      setFile(null);
      setType("");
      if (fileInput.current) fileInput.current.value = "";
      docs.reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setUploading(false);
    }
  }

  async function onPreview(d: ApplicationDocument) {
    setBusyId(d.id);
    try {
      const blob = await admissionsApi.documentFile(d.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(d: ApplicationDocument) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    setBusyId(d.id);
    try {
      await admissionsApi.deleteDocument(d.id);
      toast.success(t("toast.deleted"));
      docs.reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusyId(null);
    }
  }

  async function onReplace(f: File | null) {
    const id = replaceTarget;
    setReplaceTarget(null);
    if (replaceInput.current) replaceInput.current.value = "";
    if (!f || !id) return;
    const problem = validateFile(f);
    if (problem) return toast.error(t(problem));
    setBusyId(id);
    try {
      await admissionsApi.replaceDocument(id, f);
      toast.success(t("toast.saved"));
      docs.reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageTitle subtitle={t("upload.hint")}>{t("stu.docsTitle")}</PageTitle>
      <div className="space-y-5">
        {locked && <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">{t("stu.docLocked")}</p>}

        <Card>
          <fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("stu.docType")} required error={typeError ?? undefined}>
              <Select value={type} onChange={(e) => setType(e.target.value as DocumentType | "")}>
                <option value="">{t("common.choose")}</option>
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {t(`adm.docType.${d}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("stu.docFile")} required error={fileError ?? undefined}>
              <Input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
            </Field>
            <div className="sm:col-span-2">
              <Button onClick={onUpload} loading={uploading}>
                {t("action.upload")}
              </Button>
            </div>
          </fieldset>
        </Card>

        <Card>
          <input ref={replaceInput} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onReplace(e.target.files?.[0] ?? null)} />
          {docs.loading ? (
            <SkeletonList />
          ) : docs.error ? (
            <ErrorState error={docs.error} onRetry={docs.reload} />
          ) : !docs.data || docs.data.length === 0 ? (
            <EmptyState message={t("table.empty")} hint={t("stu.docEmptyHint")} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {docs.data.map((d) => {
                const uploaded = d.fileName !== null;
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <div className="font-semibold text-navy-900">{t(`adm.docType.${d.type}`)}</div>
                      {uploaded && (
                        <div className="truncate text-xs text-slate-500">
                          <span className="ltr-text">{d.fileName}</span> · {fmtSize(d.size)} · {t("stu.docUploadedAt")} {formatDate(d.uploadedAt)}
                        </div>
                      )}
                      {d.reviewComment && d.status !== "valid" && <div className="mt-0.5 text-xs font-medium text-rose-600">{d.reviewComment}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={documentStatusTone[d.status]}>{t(documentStatusKey(d.status))}</Badge>
                      {uploaded && (
                        <Button variant="secondary" size="sm" icon={<Eye className="h-4 w-4" />} loading={busyId === d.id} onClick={() => onPreview(d)}>
                          {t("action.preview")}
                        </Button>
                      )}
                      {uploaded && !locked && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<RefreshCw className="h-4 w-4" />}
                            disabled={busyId === d.id}
                            onClick={() => {
                              setReplaceTarget(d.id);
                              replaceInput.current?.click();
                            }}
                          >
                            {t("action.replace")}
                          </Button>
                          <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} disabled={busyId === d.id} onClick={() => onDelete(d)}>
                            {t("action.delete")}
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

export default function DocumentsPage() {
  return (
    <RoleGuard roles={["student"]}>
      <DocumentsContent />
    </RoleGuard>
  );
}
