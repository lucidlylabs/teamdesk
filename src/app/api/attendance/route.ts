import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayUTC, toUTCDay, ymd } from "@/lib/dates";

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currentTask: z.string().min(1).max(280),
  workingRepo: z.string().max(280).optional().default(""),
  taskStatus: z.string().max(40),
  blockers: z.string().max(800).optional().default(""),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TEAM" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const target = toUTCDay(body.date);
  const today = todayUTC();
  if (ymd(target) !== ymd(today)) {
    return NextResponse.json(
      { error: `{${ymd(today)}} entries valid only.` },
      { status: 400 }
    );
  }

  const row = await prisma.attendance.upsert({
    where: { userId_date: { userId: session.user.id, date: target } },
    update: {
      status: "PRESENT",
      currentTask: body.currentTask,
      workingRepo: body.workingRepo || null,
      taskStatus: body.taskStatus,
      blockers: body.blockers || null,
    },
    create: {
      userId: session.user.id,
      date: target,
      status: "PRESENT",
      currentTask: body.currentTask,
      workingRepo: body.workingRepo || null,
      taskStatus: body.taskStatus,
      blockers: body.blockers || null,
    },
  });

  return NextResponse.json({ ok: true, row });
}
