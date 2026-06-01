import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { PasswordForm } from "./PasswordForm";

export const maxDuration = 30;

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?from=/account");

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isTeam = role === "TEAM" || role === "ADMIN";

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const history = isTeam
    ? await prisma.attendance.findMany({
        where: { userId, date: { gte: since } },
        select: { date: true, status: true, currentTask: true, workingRepo: true, taskStatus: true, blockers: true },
        orderBy: { date: "desc" },
      })
    : [];

  return (
    <div>
      <Nav name={session.user.name || session.user.email!} role={role} />
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fadeUp">
        <div>
          <h1 className="text-3xl font-semibold">Account</h1>
          <p className="text-paper/60 mt-1">Manage your sign-in and review recent activity.</p>
        </div>

        <section className="card space-y-2">
          <div className="text-xs uppercase tracking-wider text-paper/50">Signed in as</div>
          <div className="text-lg font-medium">{session.user.name || "—"}</div>
          <div className="text-sm text-paper/70">{session.user.email}</div>
          <div className="text-xs text-paper/50">Role: {role}</div>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Change password</h2>
          <PasswordForm />
        </section>

        {isTeam && (
          <section className="card">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-lg font-semibold">Last 30 days</h2>
              <span className="text-xs text-paper/50">{history.length} record{history.length === 1 ? "" : "s"}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-paper/60 text-sm">No check-ins yet in the past 30 days.</p>
            ) : (
              <ul className="divide-y divide-paper/10">
                {history.map((h) => (
                  <li key={h.date.toISOString()} className="py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-sm">{h.date.toISOString().slice(0, 10)}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full " +
                            (h.status === "PRESENT" ? "bg-moss/20 text-moss" : "bg-accent/10 text-accent")
                          }
                        >
                          {h.status}
                        </span>
                        {h.taskStatus && (
                          <span className="text-[10px] uppercase tracking-wider text-paper/50">{h.taskStatus}</span>
                        )}
                      </div>
                    </div>
                    {h.currentTask && <div className="text-sm text-paper/80">{h.currentTask}</div>}
                    {h.workingRepo && (
                      <div className="text-xs text-accent break-all">{h.workingRepo}</div>
                    )}
                    {h.blockers && <div className="text-xs text-paper/60">Blockers: {h.blockers}</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
