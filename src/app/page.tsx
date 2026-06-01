import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "TEAM" || session.user.role === "ADMIN" ? "/team" : "/desk");
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl space-y-6 animate-fadeUp">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-paper/60">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Lucidly · TeamDesk
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold leading-tight">
          The desk where the team <span className="text-accent">locks in</span>.
        </h1>
        <p className="text-paper/70 text-lg">
          Daily check-ins. Live pipelines. Shared research. Consistency, broadcast.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link href="/signin" className="btn-primary">Sign in</Link>
          <Link href="/signup" className="btn-ghost">Create account</Link>
        </div>
      </div>
    </main>
  );
}
