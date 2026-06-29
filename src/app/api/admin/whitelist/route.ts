import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const items = await prisma.whitelist.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ items });
}

const AddBody = z.object({
  email: z.string().email(),
  note: z.string().max(120).optional().default(""),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  let body;
  try { body = AddBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }
  const email = body.email.toLowerCase();
  const row = await prisma.whitelist.upsert({
    where: { email },
    update: { note: body.note || null },
    create: { email, note: body.note || null },
  });
  return NextResponse.json({ ok: true, row });
}

const DeleteBody = z.object({ email: z.string().email() });

export async function DELETE(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  let body;
  try { body = DeleteBody.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }
  await prisma.whitelist.delete({ where: { email: body.email.toLowerCase() } });
  return NextResponse.json({ ok: true });
}
