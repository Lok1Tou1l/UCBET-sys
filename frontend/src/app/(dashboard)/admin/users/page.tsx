"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageTitle, Select, SkeletonList } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/features/auth/guards";
import { adminApi } from "@/features/admin/api";
import { useApi } from "@/hooks/use-api";
import { useI18n } from "@/providers/i18n-provider";
import { errorMessage } from "@/lib/utils/errors";
import { ROLES, type Role, type User } from "@/types";

const PAGE_SIZE = 10;

function UsersContent() {
  const { t } = useI18n();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, error, loading, reload } = useApi((s) => adminApi.listUsers({ page, pageSize: PAGE_SIZE, q: search }, s), [page, search]);

  const [editing, setEditing] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("student");
  const [scopeId, setScopeId] = useState("");
  const [saving, setSaving] = useState(false);
  const scopes = useApi((s) => adminApi.listScopes(s), []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function toggleActive(u: User) {
    try {
      await adminApi.setActive(u.id, !u.active);
      toast.success(t("toast.saved"));
      reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    }
  }

  function openEdit(u: User) {
    setEditing(u);
    setRole(u.role === "unknown" ? "student" : u.role);
    setScopeId(u.scope?.id ?? "");
  }

  async function saveRole() {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.setRole(editing.id, role, scopeId || null);
      toast.success(t("toast.saved"));
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setSaving(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageTitle>{t("iam.usersTitle")}</PageTitle>
      <Card>
        <form onSubmit={onSearch} className="mb-4 flex gap-2">
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("iam.searchUsers")} />
          <Button type="submit" variant="secondary">
            {t("action.search")}
          </Button>
        </form>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState message={t("table.empty")} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-start text-slate-500">
                    <th className="p-2 text-start">{t("iam.fullName")}</th>
                    <th className="p-2 text-start">{t("auth.loginId")}</th>
                    <th className="p-2 text-start">{t("iam.role")}</th>
                    <th className="p-2 text-start">{t("iam.scope")}</th>
                    <th className="p-2 text-start">{t("common.status")}</th>
                    <th className="p-2 text-start">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id} className="border-b border-slate-200/60">
                      <td className="p-2">{u.fullName}</td>
                      <td className="p-2">{u.username}</td>
                      <td className="p-2">{t(`role.${u.role}`)}</td>
                      <td className="p-2">{u.scope?.name ?? "—"}</td>
                      <td className="p-2">
                        <Badge tone={u.active ? "success" : "danger"}>{u.active ? t("iam.active") : t("iam.inactive")}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => openEdit(u)}>
                            {t("iam.editRole")}
                          </Button>
                          <Button variant={u.active ? "danger" : "primary"} onClick={() => toggleActive(u)}>
                            {u.active ? t("iam.deactivate") : t("iam.activate")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("action.previous")}
              </Button>
              <span>
                {t("table.page")} {page} / {totalPages}
              </span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("action.next")}
              </Button>
            </div>
          </>
        )}
      </Card>

      <Modal open={!!editing} title={editing ? `${t("iam.editRole")} — ${editing.fullName}` : ""} onClose={() => setEditing(null)}>
        <div className="space-y-4">
          <Field label={t("iam.role")}>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role.${r}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("iam.scope")}>
            {scopes.error ? (
              <ErrorState error={scopes.error} onRetry={scopes.reload} />
            ) : (
              <Select value={scopeId} onChange={(e) => setScopeId(e.target.value)} disabled={scopes.loading}>
                <option value="">{t("iam.noScope")}</option>
                {(scopes.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {t("action.cancel")}
            </Button>
            <Button onClick={saveRole} loading={saving}>
              {t("action.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function UsersPage() {
  return (
    <RoleGuard roles={["sys_admin"]}>
      <UsersContent />
    </RoleGuard>
  );
}
