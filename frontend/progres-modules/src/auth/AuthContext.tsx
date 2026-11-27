/**
 * Minimal auth/permission stub.
 *
 * Identity & Access (Module 1) belongs to another developer. This stub only exposes the
 * contract the three modules need: the current user and `can(permission)`.
 * When the real identity service is integrated, replace the body of AuthProvider with the
 * user/permissions returned by the backend – nothing else changes.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Permission =
  | 'admissions.view'
  | 'admissions.decide'
  | 'records.view'
  | 'records.manage'
  | 'renovation.view'
  | 'renovation.manage';

export type RoleId = 'admin' | 'registrar' | 'records' | 'renovation' | 'viewer';

export const ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {
  admin: ['admissions.view', 'admissions.decide', 'records.view', 'records.manage', 'renovation.view', 'renovation.manage'],
  registrar: ['admissions.view', 'admissions.decide', 'records.view'],
  records: ['records.view', 'records.manage', 'admissions.view'],
  renovation: ['renovation.view', 'renovation.manage'],
  viewer: ['admissions.view', 'records.view', 'renovation.view'],
};

export const ROLES: RoleId[] = ['admin', 'registrar', 'records', 'renovation', 'viewer'];

interface AuthValue {
  user: { id: string; name: string; initials: string };
  role: RoleId;
  setRole: (r: RoleId) => void;
  permissions: Permission[];
  can: (p: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>(() => (localStorage.getItem('progres_role') as RoleId) || 'admin');

  const value = useMemo<AuthValue>(() => {
    const permissions = ROLE_PERMISSIONS[role];
    return {
      user: { id: 'u-ikram', name: 'Ikram', initials: 'IK' },
      role,
      setRole: (r) => {
        localStorage.setItem('progres_role', r);
        setRoleState(r);
      },
      permissions,
      can: (p) => permissions.includes(p),
    };
  }, [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export const usePermission = (p: Permission) => useAuth().can(p);
