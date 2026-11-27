"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  push: (type: ToastType, message: string) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
let counter = 0;

const STYLE: Record<ToastType, { box: string; icon: typeof Info }> = {
  success: { box: "border-emerald-200 bg-white text-emerald-800", icon: CheckCircle2 },
  error: { box: "border-rose-200 bg-white text-rose-800", icon: XCircle },
  info: { box: "border-brand-200 bg-white text-brand-800", icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++counter;
    setItems((s) => [...s, { id, type, message }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 5000);
  }, []);

  const api = useMemo<ToastApi>(() => ({ push, success: (m) => push("success", m), error: (m) => push("error", m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[60] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {items.map((i) => {
          const { box, icon: Icon } = STYLE[i.type];
          return (
            <div key={i.id} className={cn("pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-pop", box)}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{i.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
