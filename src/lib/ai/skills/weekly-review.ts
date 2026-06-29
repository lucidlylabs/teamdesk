import { z } from "zod";
import type { AiSkill } from "../types";
import { ymd } from "@/lib/dates";

const input = z.object({
  days: z.array(
    z.object({
      date: z.string(),
      items: z.array(z.object({ title: z.string(), status: z.string() })),
      recap: z.string().nullable(),
    })
  ),
  checkins: z.array(
    z.object({ date: z.string(), present: z.number(), blockers: z.array(z.string()) })
  ),
});
type Input = z.infer<typeof input>;

const output = z.object({
  wins: z.array(z.string().max(240)).max(5),
  risks: z.array(z.string().max(240)).max(5),
  nextFocus: z.array(z.string().max(240)).max(3),
});
type Output = z.infer<typeof output>;

/** Skill #4: synthesize the last 7 days of focus + attendance into wins / risks / next focus. */
export const weeklyReview: AiSkill<Input, Output> = {
  name: "weekly-review",
  role: "ADMIN",
  temperature: 0.6,
  inputSchema: input,
  outputSchema: output,
  async prepare({ prisma, today }) {
    const weekAgo = new Date(today.getTime() - 6 * 86400000);
    const [focusDays, attendance] = await Promise.all([
      prisma.dailyFocus.findMany({
        where: { date: { gte: weekAgo } },
        orderBy: { date: "desc" },
        include: { items: { orderBy: { rank: "asc" } } },
      }),
      prisma.attendance.findMany({ where: { date: { gte: weekAgo } } }),
    ]);
    const byDate = new Map<string, { present: number; blockers: string[] }>();
    for (const a of attendance) {
      const k = ymd(a.date);
      const cur = byDate.get(k) ?? { present: 0, blockers: [] };
      if (a.status === "PRESENT") cur.present++;
      if (a.blockers) cur.blockers.push(a.blockers);
      byDate.set(k, cur);
    }
    return {
      days: focusDays.map((d) => ({
        date: ymd(d.date),
        items: d.items.map((i) => ({ title: i.title, status: i.status })),
        recap: d.recap,
      })),
      checkins: [...byDate.entries()].map(([date, v]) => ({ date, present: v.present, blockers: v.blockers })),
    };
  },
  buildMessages(i) {
    const days = i.days
      .map(
        (d) =>
          `${d.date}: ${d.items.map((x) => `${x.title} [${x.status}]`).join("; ") || "(no focus)"}${
            d.recap ? ` — recap: ${d.recap}` : ""
          }`
      )
      .join("\n");
    return {
      system:
        "You are a founder running a Friday weekly review. From the week's daily focus and attendance, " +
        "produce concrete wins (what actually got done to perfection), real risks (slippage, repeated misses, blockers), " +
        "and 1-3 suggested focuses for next week. Be specific, not generic. " +
        'Return ONLY JSON: {"wins": [string], "risks": [string], "nextFocus": [string]}.',
      user: `This week's focus log:\n${days || "(empty)"}\n\nAttendance by day:\n${
        i.checkins.map((c) => `${c.date}: ${c.present} present${c.blockers.length ? `, blockers: ${c.blockers.join("; ")}` : ""}`).join("\n") || "(none)"
      }`,
    };
  },
  fallback(i) {
    let done = 0;
    let total = 0;
    for (const d of i.days) for (const it of d.items) {
      total++;
      if (it.status === "DONE_PERFECT") done++;
    }
    return {
      wins: total
        ? [`${done}/${total} focus items done to perfection across ${i.days.length} day(s).`]
        : ["No focus history this week."],
      risks: ["AI offline — narrative summary unavailable."],
      nextFocus: [],
    };
  },
};
