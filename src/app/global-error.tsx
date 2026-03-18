"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#08090c] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-[#d4d4d8]">Algo salió mal</h2>
          <p className="text-[#71717a] text-sm font-mono">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-sm font-bold hover:brightness-110 transition-all cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
