import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { DeskTabs } from "./Tabs";

export const maxDuration = 30;

export default async function DeskPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?from=/desk");

  const [latestSummary, pipelines, research] = await Promise.all([
    prisma.dailySummary.findFirst({ orderBy: { date: "desc" } }),
    prisma.pipeline.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.research.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div>
      <Nav name={session.user.name || session.user.email!} role={session.user.role} />
      <main className="max-w-6xl mx-auto px-6 py-10 animate-fadeUp">
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
        />
      </main>
    </div>
  );
}
