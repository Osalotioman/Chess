"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/arena", label: "Arena" },
  { href: "/lobby", label: "Lobby" },
  { href: "/games", label: "Games" },
  { href: "/auth", label: "Auth" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-60 border-b border-slate-700/70 bg-slate-950/80 px-4 py-2 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                isActive
                  ? "border-emerald-300 bg-emerald-300 text-slate-900"
                  : "border-transparent bg-transparent text-slate-300 hover:border-emerald-400/50 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
