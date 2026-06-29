import { z } from "zod";
import type { AiSkill } from "../types";

const input = z.object({
  question: z.string().min(1).max(1000),
  northStar: z.string().nullable().optional(),
  weekGoal: z.string().nullable().optional(),
  // supplied by prepare() (always present server-side)
  items: z.array(z.object({ rank: z.number(), title: z.string(), status: z.string() })),
  blockers: z.array(z.string()),
});
type Input = z.infer<typeof input>;

const output = z.object({
  problem: z.string().max(800),
  options: z.array(z.object({ label: z.string().max(160), tradeoff: z.string().max(400) })).max(3),
  recommendation: z.string().max(800),
});
type Output = z.infer<typeof output>;

function contextLine(i: Input): string {
  return [
    i.northStar ? `North Star: ${i.northStar}` : null,
    i.weekGoal ? `This week's goal: ${i.weekGoal}` : null,
    i.items.length
      ? `Today's 3:\n${i.items.map((x) => `${x.rank}. ${x.title} [${x.status}]`).join("\n")}`
      : "No focus items set today.",
    i.blockers.length ? `Team blockers today:\n- ${i.blockers.join("\n- ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Skill #2: a YC-style office-hours advisor, fed today's context. */
export const officeHours: AiSkill<Input, Output> = {
  name: "office-hours",
  role: "ADMIN",
  temperature: 0.6,
  inputSchema: input,
  outputSchema: output,
  async prepare({ prisma, today }) {
    const [settings, focus, attendance] = await Promise.all([
      prisma.focusSettings.findUnique({ where: { id: "singleton" } }),
      prisma.dailyFocus.findUnique({
        where: { date: today },
        include: { items: { orderBy: { rank: "asc" } } },
      }),
      prisma.attendance.findMany({
        where: { date: today, status: "PRESENT" },
        select: { blockers: true },
      }),
    ]);
    return {
      northStar: settings?.northStar ?? null,
      weekGoal: settings?.weekGoal ?? null,
      items: (focus?.items ?? []).map((i) => ({ rank: i.rank, title: i.title, status: i.status })),
      blockers: attendance.map((a) => a.blockers).filter((b): b is string => !!b),
    };
  },
  buildMessages(i) {
    return {
      system:
        "You are a YC-style office-hours advisor for an early-stage founder. " +
        "Name the real problem behind the question, give 2-3 concrete options with honest tradeoffs, " +
        "then end with one clear recommendation. Be direct and specific; ground advice in the founder's context. " +
        'Return ONLY JSON: {"problem": string, "options": [{"label": string, "tradeoff": string}], "recommendation": string}.',
      user: `Founder's question:\n${i.question}\n\nContext:\n${contextLine(i)}`,
    };
  },
  fallback(i) {
    return {
      problem: "AI offline — can't advise right now.",
      options: [],
      recommendation: `Here's your current context to think against:\n${contextLine(i)}`,
    };
  },
};
