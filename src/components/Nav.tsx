"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const isTeam = role === "TEAM" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  const links: { href: string; label: string }[] = [
    ...(isTeam ? [{ href: "/team", label: "Team" }] : []),
    { href: "/desk", label: "Desk" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b border-paper/10 bg-ink/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-semibold tracking-wide">Lucidly · TeamDesk</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {links.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "px-3 py-1.5 rounded-md transition " +
                  (active
                    ? "bg-paper/10 text-paper"
                    : "text-paper/60 hover:text-paper hover:bg-paper/5")
                }
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/account" className="text-paper/70 hover:text-paper ml-2">
            <span className="text-paper">{name}</span>{" "}
            <span className="text-paper/40">· {role}</span>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost text-xs ml-1">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
