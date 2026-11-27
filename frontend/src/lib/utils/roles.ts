import type { Role, RoleOrUnknown } from "@/types";

// Backend roles are free-form lowercase strings (users.role, default "student").
// Aliases below let the UI accept the spellings the other modules may emit.
const ALIASES: Record<string, Role> = {
  student: "student",
  etudiant: "student",
  teacher: "teacher",
  professor: "teacher",
  enseignant: "teacher",
  registrar: "registrar",
  scolarite: "registrar",
  dept_head: "dept_head",
  department_head: "dept_head",
  head_of_department: "dept_head",
  dean: "dept_head",
  renovation: "renovation_manager",
  renovation_manager: "renovation_manager",
  contractor_manager: "renovation_manager",
  sys_admin: "sys_admin",
  system_admin: "sys_admin",
  admin: "sys_admin",
};

export function normalizeRole(raw: unknown): RoleOrUnknown {
  const key = String(raw ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ALIASES[key] ?? "unknown";
}
