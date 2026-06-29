import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/dates";
import { serializeFocus } from "@/lib/focus";

export const maxDuration = 30;

// POST — build today's THE 3 from the most recent prior day's unfinished items.
// Allowed only when today has no items yet.
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const date = todayUTC();

  const today = await prisma.dailyFocus.findUnique({
    where: { date },
    include: { items: true },
  });
  if (today && today.items.length > 0)
    return NextResponse.json({ error: "Today already has focus items" }, { status: 409 });

  const prior = await prisma.dailyFocus.findFirst({
    where: { date: { lt: date } },
    orderBy: { date: "desc" },
    include: { items: { orderBy: { rank: "asc" } } },
  });
  if (!prior) return NextResponse.json({ error: "No prior focus to carry" }, { status: 404 });

  const unfinished = prior.items.filter((i) => i.status !== "DONE_PERFECT").slice(0, 3);
  if (unfinished.length === 0)
    return NextResponse.json({ error: "Nothing to carry — prior day was fully done" }, { status: 404 });

  const focus = await prisma.dailyFocus.upsert({
    where: { date },
    update: {},
    create: { date },
  });

  await prisma.$transaction(
    unfinished.map((i, idx) =>
      prisma.focusItem.create({
        data: {
          focusId: focus.id,
          rank: idx + 1,
          title: i.title,
          owner: i.owner,
          revenueWhy: i.revenueWhy,
          perfectWhen: i.perfectWhen,
          // status defaults to NOT_STARTED
        },
      })
    )
  );

  const fresh = await prisma.dailyFocus.findUnique({
    where: { date },
    include: { items: { orderBy: { rank: "asc" } } },
  });
  return NextResponse.json({ ok: true, focus: serializeFocus(date, fresh) });
}
