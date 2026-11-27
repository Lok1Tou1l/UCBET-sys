"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { AuthGuard } from "@/features/auth/guards";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
