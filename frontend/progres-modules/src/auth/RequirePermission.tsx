import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AccessDenied } from '@/components/ui';
import { useAuth, type Permission } from './AuthContext';

/** Route guard: renders the child routes only when the user holds the permission. */
export function RequirePermission({ permission, children }: { permission: Permission; children?: ReactNode }) {
  const { can } = useAuth();
  if (!can(permission)) return <AccessDenied />;
  return <>{children ?? <Outlet />}</>;
}

/** Inline guard for buttons / blocks that need a write permission. */
export function Can({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
