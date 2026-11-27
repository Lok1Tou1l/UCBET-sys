"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ForbiddenView } from "@/components/shared/forbidden-view";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import type { Role } from "@/types";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  return <>{children}</>;
}

// Client-side guard for UX only: the backend (require_roles) remains the real authority.
export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !(roles as string[]).includes(user.role)) return <ForbiddenView />;
  return <>{children}</>;
}
