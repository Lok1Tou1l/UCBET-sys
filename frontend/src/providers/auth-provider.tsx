"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { setUnauthorizedHandler, tokenStore } from "@/lib/api/client";
import type { User } from "@/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthValue {
  user: User | null;
  status: Status;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, router]);

  useEffect(() => {
    if (!tokenStore.get()) {
      setStatus("unauthenticated");
      return;
    }
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then((u) => {
        setUser(u);
        setStatus("authenticated");
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        clearSession();
      });
    return () => controller.abort();
  }, [clearSession]);

  const login = useCallback(async (loginId: string, password: string) => {
    const token = await authApi.login(loginId, password);
    tokenStore.set(token.access_token);
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch (e) {
      tokenStore.clear();
      throw e;
    }
  }, []);

  // The backend has no logout endpoint (stateless JWT): the session is dropped client-side.
  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  const value = useMemo(() => ({ user, status, login, logout, setUser }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
