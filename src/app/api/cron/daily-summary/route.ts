import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/dates";
import { generateDailySummary } from "@/lib/summarize";
import { sendDailySummary } from "@/lib/discord";

export const maxDuration = 60;

/**
 * Runs end of day:
 *  1. For every whitelisted team member without a PRESENT record today, insert ABSENT.
 *  2. Build a 4-line summary from today's rows.
 *  3. Persist DailySummary + push to Discord.
 *
 * Trigger:
 *   POST /api/cron/daily-summary
 *   header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayUTC();

  // 1. Mark absent for whitelisted users without entry
  const whitelisted = await prisma.whitelist.findMany();
  const whitelistEmails = whitelisted.map((w: { email: string }) => w.email.toLowerCase());
  const teamUsers = await prisma.user.findMany({
    where: { role: { in: ["TEAM", "ADMIN"] }, email: { in: whitelistEmails } },
    select: { id: true, email: true, name: true },
  });

  for (const u of teamUsers) {
    await prisma.attendance.upsert({
      where: { userId_date: { userId: u.id, date: today } },
      update: {}, // don't touch existing PRESENT rows
      create: { userId: u.id, date: today, status: "ABSENT" },
    });
  }

  // 2. Build summary from today's rows
  const rows = await prisma.attendance.findMany({
    where: { date: today, userId: { in: teamUsers.map((t: { id: string }) => t.id) } },
    include: { user: { select: { name: true, email: true } } },
  });
  const { summary, refs, source } = await generateDailySummary(rows);

  // 3. Persist + push
  const saved = await prisma.dailySummary.upsert({
    where: { date: today },
    update: { summary, refs: refs.join("\n") },
    create: { date: today, summary, refs: refs.join("\n") },
  });

  const discord = await sendDailySummary({
    date: today.toISOString().slice(0, 10),
    summary,
    refs,
  }).catch((e) => ({ error: String(e) }));

  return NextResponse.json({ ok: true, source, summary: saved, discord });
}

export const GET = POST;
