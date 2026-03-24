"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "error" | "success" | "info";

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const COLORS: Record<ToastType, { border: string; text: string }> = {
  error: { border: "border-[#f87171]/30", text: "text-[#f87171]" },
  success: { border: "border-[#4ade80]/30", text: "text-[#4ade80]" },
  info: { border: "border-[#5eead4]/30", text: "text-[#5eead4]" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] flex flex-col gap-2 max-w-[90vw] w-[380px]">
        {toasts.map((toast) => {
          const c = COLORS[toast.type];
          return (
            <div
              key={toast.id}
              className={`bg-[#0e1015] border ${c.border} ${c.text} px-4 py-2.5 rounded-lg font-mono text-[12px] animate-in slide-in-from-bottom-2 fade-in-0 duration-200`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
