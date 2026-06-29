import { NextResponse } from "next/server";
import { requireTeam } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { serializeFocus } from "@/lib/focus";

export const maxDuration = 30;

// GET — last 30 days of focus, newest first (TEAM/ADMIN). Powers the Focus Log tab.
export async function GET() {
  const { error } = await requireTeam();
  if (error) return error;

  const days = await prisma.dailyFocus.findMany({
    orderBy: { date: "desc" },
    take: 30,
    include: { items: { orderBy: { rank: "asc" } } },
  });

  return NextResponse.json({ days: days.map((d) => serializeFocus(d.date, d)) });
}
