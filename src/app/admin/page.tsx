import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { AdminClient } from "./AdminClient";
import { todayUTC } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?from=/admin");
  if (session.user.role !== "ADMIN") redirect("/team");

  const today = todayUTC();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [whitelist, teamUsers, todayRows, history, latestSummary] = await Promise.all([
    prisma.whitelist.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["TEAM", "ADMIN"] } },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.attendance.findMany({
      where: { date: today },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: thirtyDaysAgo, lte: today } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    }),
    prisma.dailySummary.findFirst({ orderBy: { date: "desc" } }),
  ]);

  return (
    <div>
      <Nav name={session.user.name || session.user.email!} role={session.user.role} />
      <main className="max-w-6xl mx-auto px-6 py-10 animate-fadeUp space-y-10">
        <AdminClient
          today={today.toISOString().slice(0, 10)}
          whitelist={whitelist.map((w: any) => ({
            id: w.id,
            email: w.email,
            note: w.note,
            createdAt: w.createdAt.toISOString(),
          }))}
          teamUsers={teamUsers.map((u: any) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
          }))}
          todayRows={todayRows.map((r: any) => ({
            id: r.id,
            user: { name: r.user.name, email: r.user.email },
            status: r.status,
            currentTask: r.currentTask,
            workingRepo: r.workingRepo,
            taskStatus: r.taskStatus,
            blockers: r.blockers,
          }))}
          history={history.map((r: any) => ({
            id: r.id,
            date: r.date.toISOString().slice(0, 10),
            user: { name: r.user.name, email: r.user.email },
            status: r.status,
            currentTask: r.currentTask,
            workingRepo: r.workingRepo,
            taskStatus: r.taskStatus,
            blockers: r.blockers,
          }))}
          latestSummary={
            latestSummary
              ? {
                  date: latestSummary.date.toISOString().slice(0, 10),
                  text: latestSummary.summary,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
