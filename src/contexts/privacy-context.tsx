"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface PrivacyContextValue {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  isPrivate: false,
  togglePrivacy: () => {},
});

export function usePrivacy() {
  return useContext(PrivacyContext);
}

const STORAGE_KEY = "la-caja-privacy";

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsPrivate(true);
  }, []);

  const togglePrivacy = useCallback(() => {
    setIsPrivate((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      <div data-privacy={isPrivate ? "on" : "off"}>
        {children}
      </div>
    </PrivacyContext.Provider>
  );
}
