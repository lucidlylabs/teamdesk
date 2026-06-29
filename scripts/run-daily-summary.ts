/**
 * Standalone runner for the daily summary job.
 * Use with a cron tool (cron, systemd, GitHub Actions, etc.):
 *   node --env-file=.env --import tsx scripts/run-daily-summary.ts
 * or (Node 20.6+):
 *   node --env-file=.env --experimental-strip-types scripts/run-daily-summary.ts
 *
 * Reuses the same logic as the API route — direct DB access, no HTTP hop.
 */
import { PrismaClient, Whitelist, User, Attendance } from "@prisma/client";
import { generateDailySummary } from "../src/lib/summarize";
import { sendDailySummary } from "../src/lib/discord";
import { todayUTC } from "../src/lib/dates";

const prisma = new PrismaClient();

async function main() {
  const today = todayUTC();

  const whitelisted: Whitelist[] = await prisma.whitelist.findMany();
  const emails = whitelisted.map((w: Whitelist) => w.email.toLowerCase());
  const teamUsers: Pick<User, "id">[] = await prisma.user.findMany({
    where: { role: { in: ["TEAM", "ADMIN"] }, email: { in: emails } },
    select: { id: true },
  });
  for (const u of teamUsers) {
    await prisma.attendance.upsert({
      where: { userId_date: { userId: u.id, date: today } },
      update: {},
      create: { userId: u.id, date: today, status: "ABSENT" },
    });
  }
  const rows: (Attendance & { user: Pick<User, "name" | "email"> })[] = await prisma.attendance.findMany({
    where: { date: today, userId: { in: teamUsers.map((t: { id: string }) => t.id) } },
    include: { user: { select: { name: true, email: true } } },
  });
  const { summary, refs, source } = await generateDailySummary(rows);
  console.log(`source: ${source}`);
  await prisma.dailySummary.upsert({
    where: { date: today },
    update: { summary, refs: refs.join("\n") },
    create: { date: today, summary, refs: refs.join("\n") },
  });
  await sendDailySummary({
    date: today.toISOString().slice(0, 10),
    summary,
    refs,
  });
  console.log("daily summary pushed");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
