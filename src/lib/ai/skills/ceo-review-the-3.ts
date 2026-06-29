import { z } from "zod";
import type { AiSkill } from "../types";

const input = z.object({
  northStar: z.string().nullable().optional(),
  weekGoal: z.string().nullable().optional(),
  items: z.array(
    z.object({
      rank: z.number(),
      title: z.string(),
      revenueWhy: z.string(),
      perfectWhen: z.string(),
      status: z.string(),
    })
  ),
});
type Input = z.infer<typeof input>;

const output = z.object({
  verdict: z.string().max(600),
  perItem: z.array(
    z.object({ rank: z.number(), call: z.enum(["keep", "sharpen", "cut"]), why: z.string().max(300) })
  ),
  missing: z.array(z.string().max(200)).max(3),
  recommendation: z.string().max(600),
});
type Output = z.infer<typeof output>;

const REVENUE_SIGNAL = /\d|\$|%|customer|client|deal|contract|revenue|mrr|arr|pipeline|conversion/i;

/** Skill #3: pressure-test today's THE 3 against the North Star + week goal. */
export const ceoReviewThe3: AiSkill<Input, Output> = {
  name: "ceo-review-the-3",
  role: "ADMIN",
  temperature: 0.5,
  inputSchema: input,
  outputSchema: output,
  async prepare({ prisma, today }) {
    const [settings, focus] = await Promise.all([
      prisma.focusSettings.findUnique({ where: { id: "singleton" } }),
      prisma.dailyFocus.findUnique({
        where: { date: today },
        include: { items: { orderBy: { rank: "asc" } } },
      }),
    ]);
    return {
      northStar: settings?.northStar ?? null,
      weekGoal: settings?.weekGoal ?? null,
      items: (focus?.items ?? []).map((i) => ({
        rank: i.rank,
        title: i.title,
        revenueWhy: i.revenueWhy,
        perfectWhen: i.perfectWhen,
        status: i.status,
      })),
    };
  },
  buildMessages(i) {
    const items = i.items
      .map((x) => `${x.rank}. ${x.title}\n   revenue: ${x.revenueWhy}\n   perfection: ${x.perfectWhen} [${x.status}]`)
      .join("\n");
    return {
      system:
        "You are a founder pressure-testing today's 3 priorities. For each item decide keep / sharpen / cut, " +
        "judged against whether it's the highest-leverage revenue/sales move toward the North Star and week goal. " +
        "Name up to 3 important things MISSING from the set. Be ruthless and specific. " +
        'Return ONLY JSON: {"verdict": string, "perItem": [{"rank": number, "call": "keep"|"sharpen"|"cut", "why": string}], "missing": [string], "recommendation": string}.',
      user:
        `North Star: ${i.northStar ?? "(unset)"}\nThis week: ${i.weekGoal ?? "(unset)"}\n\nToday's 3:\n${items || "(none set)"}`,
    };
  },
  fallback(i) {
    const done = i.items.filter((x) => x.status === "DONE_PERFECT").length;
    return {
      verdict: `AI offline — heuristic only. ${done}/${i.items.length} done to perfection.`,
      perItem: i.items.map((x) => ({
        rank: x.rank,
        call: REVENUE_SIGNAL.test(x.revenueWhy) ? ("keep" as const) : ("sharpen" as const),
        why: REVENUE_SIGNAL.test(x.revenueWhy)
          ? "Revenue line names a concrete signal."
          : "Revenue line has no number/customer — sharpen it.",
      })),
      missing: [],
      recommendation: "Connect a real model for a full review.",
    };
  },
};
