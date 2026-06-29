import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeam } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/dates";
import { serializeItem } from "@/lib/focus";

export const maxDuration = 30;

const Body = z.object({
  id: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE_PERFECT"]),
});

// PATCH — change an item's status only (TEAM/ADMIN, today only).
// Any value is allowed directly; the not-started -> in-progress -> done order
// is a UI affordance, not an enforced transition.
export async function PATCH(req: Request) {
  const { error } = await requireTeam();
  if (error) return error;

  let body;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const item = await prisma.focusItem.findUnique({ where: { id: body.id }, include: { focus: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.focus.date.getTime() !== todayUTC().getTime())
    return NextResponse.json({ error: "Only today's focus is editable" }, { status: 400 });

  const updated = await prisma.focusItem.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ ok: true, item: serializeItem(updated) });
}
