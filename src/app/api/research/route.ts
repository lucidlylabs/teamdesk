import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendResearchRelay } from "@/lib/discord";

const Body = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  notes: z.string().max(800).optional().default(""),
});

export async function GET() {
  const items = await prisma.research.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TEAM" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }

  const post = await prisma.research.create({
    data: {
      title: body.title,
      url: body.url,
      notes: body.notes || null,
      postedBy: session.user.name || session.user.email || null,
    },
  });

  await sendResearchRelay({
    title: post.title,
    url: post.url,
    notes: post.notes || undefined,
    postedBy: post.postedBy || undefined,
  }).catch((e) => console.warn("research relay failed", e));

  return NextResponse.json({ ok: true, post });
}
