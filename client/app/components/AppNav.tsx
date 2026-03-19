"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/arena", label: "Arena" },
  { href: "/lobby", label: "Lobby" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Primary">
      <div className="app-nav-inner">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={`app-nav-link ${isActive ? "is-active" : ""}`}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
