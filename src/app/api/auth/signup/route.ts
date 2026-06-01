import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

const Body = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(200),
  role: z.enum(["TEAM", "USER"]),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  if (parsed.role === "TEAM") {
    const allowed = await prisma.whitelist.findUnique({ where: { email } });
    if (!allowed) {
      return NextResponse.json(
        { error: "Email not on the team whitelist. Ask an admin to add you." },
        { status: 403 }
      );
    }
  }

  const password = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: { email, name: parsed.name, password, role: parsed.role },
    select: { id: true, email: true, role: true },
  });
  return NextResponse.json({ user });
}
