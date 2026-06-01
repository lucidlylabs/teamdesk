import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { Calendar } from "./Calendar";

export const maxDuration = 30;

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?from=/team");
  if (session.user.role !== "TEAM" && session.user.role !== "ADMIN") redirect("/desk");

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const rows = await prisma.attendance.findMany({
    where: { userId: session.user.id, date: { gte: start, lt: end } },
    select: { date: true, status: true, currentTask: true, taskStatus: true },
    orderBy: { date: "asc" },
  });

  const monthMap: Record<string, { status: "PRESENT" | "ABSENT"; currentTask?: string | null }> = {};
  type Row = { date: Date; status: "PRESENT" | "ABSENT"; currentTask: string | null };
  for (const r of rows as Row[]) {
    monthMap[r.date.toISOString().slice(0, 10)] = {
      status: r.status,
      currentTask: r.currentTask,
    };
  }

  return (
    <div>
      <Nav name={session.user.name || session.user.email!} role={session.user.role} />
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fadeUp">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Your desk</h1>
            <p className="text-paper/60 mt-1">Mark today. Stay consistent. The team is watching (in a good way).</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-paper/60">Consistency</div>
            <div className="text-2xl font-semibold">
              {(rows as Row[]).filter((r) => r.status === "PRESENT").length}/{rows.length || 1}
            </div>
          </div>
        </div>

        <Calendar year={now.getUTCFullYear()} month={now.getUTCMonth()} marks={monthMap} />
      </main>
    </div>
  );
}
