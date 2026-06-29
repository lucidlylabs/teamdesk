import { NextResponse } from "next/server";
import { requireTeam } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { todayUTC, toUTCDay } from "@/lib/dates";
import { FOCUS_SETTINGS_ID, serializeFocus, serializeSettings } from "@/lib/focus";

export const maxDuration = 30;

// GET /api/focus?date=YYYY-MM-DD  (default today) — TEAM/ADMIN.
export async function GET(req: Request) {
  const { error } = await requireTeam();
  if (error) return error;

  const raw = new URL(req.url).searchParams.get("date");
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? toUTCDay(raw) : todayUTC();

  const [settings, focus] = await Promise.all([
    prisma.focusSettings.findUnique({ where: { id: FOCUS_SETTINGS_ID } }),
    prisma.dailyFocus.findUnique({
      where: { date },
      include: { items: { orderBy: { rank: "asc" } } },
    }),
  ]);

  return NextResponse.json({
    settings: serializeSettings(settings),
    focus: serializeFocus(date, focus),
  });
}
