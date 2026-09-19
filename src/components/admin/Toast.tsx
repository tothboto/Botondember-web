"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" };
type ToastApi = { success: (message?: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} });

/**
 * „Mentve!” és hibaüzenetek az Adminban. A képernyőolvasók is felolvassák
 * (aria-live), és néhány másodperc után maguktól eltűnnek.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: Toast["tone"]) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === "error" ? 7000 : 3000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message = "Mentve!") => push(message, "success"),
      error: (message: string) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 ${
              toast.tone === "success"
                ? "bg-emerald-700 text-white ring-emerald-900/20"
                : "bg-red-700 text-white ring-red-900/20"
            }`}
          >
            {toast.tone === "success" ? (
              <CircleCheck aria-hidden className="h-5 w-5 shrink-0" />
            ) : (
              <CircleAlert aria-hidden className="h-5 w-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  return use(ToastContext);
}
