import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/dates";
import { serializeItem } from "@/lib/focus";

export const maxDuration = 30;

const CreateBody = z.object({
  title: z.string().min(1).max(280),
  owner: z.string().max(80).optional().default(""),
  revenueWhy: z.string().min(1).max(800),
  perfectWhen: z.string().min(1).max(800),
});

const PatchBody = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(280).optional(),
  owner: z.string().max(80).optional(),
  revenueWhy: z.string().min(1).max(800).optional(),
  perfectWhen: z.string().min(1).max(800).optional(),
});

const DeleteBody = z.object({ id: z.string().min(1) });

// POST — create an item on TODAY's focus (auto-creates the day). Max 3.
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body;
  try { body = CreateBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const date = todayUTC();
  const focus = await prisma.dailyFocus.upsert({
    where: { date },
    update: {},
    create: { date },
    include: { items: { orderBy: { rank: "asc" } } },
  });

  if (focus.items.length >= 3)
    return NextResponse.json({ error: "THE 3 is full" }, { status: 400 });

  const used = new Set(focus.items.map((i) => i.rank));
  const rank = [1, 2, 3].find((r) => !used.has(r))!;

  try {
    const item = await prisma.focusItem.create({
      data: {
        focusId: focus.id,
        rank,
        title: body.title,
        owner: body.owner || null,
        revenueWhy: body.revenueWhy,
        perfectWhen: body.perfectWhen,
      },
    });
    return NextResponse.json({ ok: true, item: serializeItem(item) });
  } catch (e) {
    // Unique (focusId, rank) race — treat as "full / conflict".
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json({ error: "THE 3 is full" }, { status: 400 });
    throw e;
  }
}

// PATCH — edit an item's fields (today only).
export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body;
  try { body = PatchBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const item = await prisma.focusItem.findUnique({ where: { id: body.id }, include: { focus: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.focus.date.getTime() !== todayUTC().getTime())
    return NextResponse.json({ error: "Only today's focus is editable" }, { status: 400 });

  const updated = await prisma.focusItem.update({
    where: { id: body.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.owner !== undefined ? { owner: body.owner || null } : {}),
      ...(body.revenueWhy !== undefined ? { revenueWhy: body.revenueWhy } : {}),
      ...(body.perfectWhen !== undefined ? { perfectWhen: body.perfectWhen } : {}),
    },
  });
  return NextResponse.json({ ok: true, item: serializeItem(updated) });
}

// DELETE — remove an item (today only).
export async function DELETE(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body;
  try { body = DeleteBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const item = await prisma.focusItem.findUnique({ where: { id: body.id }, include: { focus: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.focus.date.getTime() !== todayUTC().getTime())
    return NextResponse.json({ error: "Only today's focus is editable" }, { status: 400 });

  await prisma.focusItem.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
