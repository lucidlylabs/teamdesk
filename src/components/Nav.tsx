"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function Nav({ name, role }: { name: string; role: string }) {
  return (
    <header className="border-b border-paper/10 bg-ink/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-semibold tracking-wide">Lucidly · TeamDesk</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/account" className="text-paper/70 hover:text-paper">
            <span className="text-paper">{name}</span>{" "}
            <span className="text-paper/40">· {role}</span>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost text-xs">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
