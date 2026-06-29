import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/dates";

export const maxDuration = 30;

const Body = z.object({ recap: z.string().max(2000) });

// PUT — write today's end-of-day recap (ADMIN, today only).
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const date = todayUTC();
  const focus = await prisma.dailyFocus.upsert({
    where: { date },
    update: { recap: body.recap || null },
    create: { date, recap: body.recap || null },
  });
  return NextResponse.json({ ok: true, recap: focus.recap });
}
