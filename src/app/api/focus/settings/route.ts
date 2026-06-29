import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { FOCUS_SETTINGS_ID, serializeSettings } from "@/lib/focus";

export const maxDuration = 30;

const Body = z.object({
  northStar: z.string().max(280).optional(),
  weekGoal: z.string().max(280).optional(),
});

// PUT — set North Star / this week's revenue goal (ADMIN).
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const data = {
    ...(body.northStar !== undefined ? { northStar: body.northStar || null } : {}),
    ...(body.weekGoal !== undefined ? { weekGoal: body.weekGoal || null } : {}),
  };

  const settings = await prisma.focusSettings.upsert({
    where: { id: FOCUS_SETTINGS_ID },
    update: data,
    create: { id: FOCUS_SETTINGS_ID, ...data },
  });
  return NextResponse.json({ ok: true, settings: serializeSettings(settings) });
}
