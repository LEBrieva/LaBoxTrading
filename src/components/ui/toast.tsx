"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const show = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-[#0e1015] border border-[#5eead4]/30 text-[#5eead4] px-4 py-2.5 rounded-lg font-mono text-[12px] animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
