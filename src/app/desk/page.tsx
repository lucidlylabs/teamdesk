import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { DeskTabs } from "./Tabs";
import { TheThree } from "./TheThree";
import { todayUTC } from "@/lib/dates";
import { FOCUS_SETTINGS_ID, serializeFocus, serializeSettings } from "@/lib/focus";

export const maxDuration = 30;

export default async function DeskPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?from=/desk");

  const role = session.user.role;
  const isTeam = role === "TEAM" || role === "ADMIN";
  const today = todayUTC();

  const [latestSummary, pipelines, research, focusSettings, todayFocus, focusLog] =
    await Promise.all([
      prisma.dailySummary.findFirst({ orderBy: { date: "desc" } }),
      prisma.pipeline.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.research.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
      isTeam ? prisma.focusSettings.findUnique({ where: { id: FOCUS_SETTINGS_ID } }) : null,
      isTeam
        ? prisma.dailyFocus.findUnique({
            where: { date: today },
            include: { items: { orderBy: { rank: "asc" } } },
          })
        : null,
      isTeam
        ? prisma.dailyFocus.findMany({
            orderBy: { date: "desc" },
            take: 30,
            include: { items: { orderBy: { rank: "asc" } } },
          })
        : [],
    ]);

  return (
    <div>
      <Nav name={session.user.name || session.user.email!} role={session.user.role} />
      <main className="max-w-6xl mx-auto px-6 py-10 animate-fadeUp">
        {isTeam && (
          <TheThree
            settings={serializeSettings(focusSettings)}
            focus={serializeFocus(today, todayFocus)}
            role={role}
          />
        )}
        <DeskTabs
          summary={
            latestSummary
              ? {
                  date: latestSummary.date.toISOString().slice(0, 10),
                  text: latestSummary.summary,
                  refs: latestSummary.refs ? latestSummary.refs.split("\n").filter(Boolean) : [],
                }
              : null
          }
          pipelines={pipelines.map((p: any) => ({
            id: p.id,
            title: p.title,
            workingRepo: p.workingRepo,
            summary: p.summary,
            done: p.doneTasks,
            total: p.totalTasks,
            status: p.status,
          }))}
          research={research.map((r: any) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            notes: r.notes,
            postedBy: r.postedBy,
            createdAt: r.createdAt.toISOString(),
          }))}
          focusLog={isTeam ? (focusLog as any[]).map((d) => serializeFocus(d.date, d)) : null}
        />
      </main>
    </div>
  );
}
