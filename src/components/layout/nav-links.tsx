"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { title: "Dashboard", href: "/", tour: "nav-dashboard" },
  { title: "Trades", href: "/trades", tour: "nav-trades" },
  { title: "Movimientos", href: "/movimientos", tour: "nav-movimientos" },
  { title: "Calendario", href: "/calendar", tour: "nav-calendario" },
  { title: "Cuentas", href: "/accounts", tour: "nav-cuentas" },
  { title: "Estrategias", href: "/strategies", tour: "nav-estrategias" },
  { title: "Config", href: "/settings", tour: "nav-config" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    setLoggingOut(true);
    await signOut();
  }

  return (
    <>
      <nav className="hidden md:flex items-center px-8 py-2.5 border-t border-[#252833]" data-tour="nav-links">
        <div className="flex-1 flex justify-center gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tour}
                className={`relative px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold transition-colors ${
                  isActive
                    ? "text-[#5eead4]"
                    : "text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#14161e]"
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5eead4]" />
                )}
                {item.title}
              </Link>
            );
          })}
        </div>
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold text-[#71717a] hover:text-[#f87171] transition-colors cursor-pointer disabled:opacity-50"
        >
          {loggingOut ? "Saliendo..." : "Salir"}
        </button>
      </nav>

      {loggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#08090c]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 border-2 border-[#5eead4] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] uppercase tracking-[3px] text-[#5eead4] font-mono animate-pulse">
              Cerrando sesión...
            </span>
          </div>
        </div>
      )}
    </>
  );
}
