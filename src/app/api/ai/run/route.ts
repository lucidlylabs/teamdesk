import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, requireTeam } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/dates";
import { SKILLS } from "@/lib/ai/registry";
import { runSkill } from "@/lib/ai/runSkill";

export const maxDuration = 30;

const MAX_BODY = 8192;

// POST /api/ai/run  body: { skill: string, input?: object }
// Single entry point for all in-app AI skills. Per-skill role gate; output is
// validated and never persisted.
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BODY)
    return NextResponse.json({ error: "Body too large" }, { status: 413 });

  let body: { skill?: unknown; input?: unknown };
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const skill = typeof body.skill === "string" ? SKILLS[body.skill] : undefined;
  if (!skill) return NextResponse.json({ error: "Unknown skill" }, { status: 404 });

  const gate = skill.role === "ADMIN" ? await requireAdmin() : await requireTeam();
  if (gate.error) return gate.error;

  try {
    const result = await runSkill(skill, body.input ?? {}, {
      prisma,
      session: gate.session,
      today: todayUTC(),
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ZodError)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    throw e;
  }
}
