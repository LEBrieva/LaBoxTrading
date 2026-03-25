"use client";

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

  return (
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
        onClick={() => signOut()}
        className="px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold text-[#71717a] hover:text-[#f87171] transition-colors cursor-pointer"
      >
        Salir
      </button>
    </nav>
  );
}
