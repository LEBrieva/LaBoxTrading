"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { title: "Dashboard", href: "/", icon: "\u25C8" },
  { title: "Trades", href: "/trades", icon: "\u25B2" },
  { title: "Movimientos", href: "/movimientos", icon: "\u25E4" },
  { title: "Calendario", href: "/calendar", icon: "\u25A6" },
  { title: "Cuentas", href: "/accounts", icon: "\u25CE" },
  { title: "Estrategias", href: "/strategies", icon: "\u25C7" },
  { title: "Config", href: "/settings", icon: "\u2699" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-[#252833] bg-[#0e1015] pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] pt-1.5 pb-1 relative transition-colors ${
              isActive
                ? "text-[#5eead4]"
                : "text-[#71717a] active:text-[#d4d4d8]"
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-2 right-2 h-[2px] bg-[#5eead4]" />
            )}
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[9px] uppercase tracking-[1px] font-semibold">
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
