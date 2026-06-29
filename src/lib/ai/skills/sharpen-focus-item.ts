import { z } from "zod";
import type { AiSkill } from "../types";

const input = z.object({
  title: z.string().min(1).max(280),
  revenueWhy: z.string().min(1).max(800),
  perfectWhen: z.string().min(1).max(800),
});
type Input = z.infer<typeof input>;

const output = z.object({
  critique: z.string().max(1200),
  suggestion: z
    .object({
      title: z.string().max(280),
      revenueWhy: z.string().max(800),
      perfectWhen: z.string().max(800),
    })
    .nullable(),
});
type Output = z.infer<typeof output>;

const REVENUE_SIGNAL = /\d|\$|%|customer|client|deal|contract|revenue|mrr|arr|pipeline|conversion/i;
const MEASURABLE = /\d|signed|shipped|live|deployed|launched|merged|closed|paid|%/i;

/** Skill #1: critique a THE 3 focus item and propose a tightened rewrite. */
export const sharpenFocusItem: AiSkill<Input, Output> = {
  name: "sharpen-focus-item",
  role: "ADMIN",
  temperature: 0.4,
  inputSchema: input,
  outputSchema: output,
  buildMessages(i) {
    return {
      system:
        'You coach an early-stage startup\'s daily focus items ("THE 3"). ' +
        "Judge two things: (1) does this item truly move revenue or sales? " +
        "(2) is the 'perfection' bar concrete and measurable, not vibes? " +
        "Be terse and direct, founder-to-founder, 2-4 sentences of critique. " +
        "Then propose a tightened version of all three fields. " +
        'Return ONLY JSON: {"critique": string, "suggestion": {"title": string, "revenueWhy": string, "perfectWhen": string}}.',
      user: `Title: ${i.title}\nRevenue why: ${i.revenueWhy}\nPerfection bar: ${i.perfectWhen}`,
    };
  },
  fallback(i) {
    const issues: string[] = [];
    if (!REVENUE_SIGNAL.test(i.revenueWhy))
      issues.push(
        "The revenue line names no number, dollar amount, or customer — make the money impact concrete."
      );
    if (!MEASURABLE.test(i.perfectWhen))
      issues.push(
        "The perfection bar isn't measurable — add a number, date, or observable outcome (signed / shipped / live)."
      );
    const critique = issues.length
      ? `AI offline — heuristic check:\n- ${issues.join("\n- ")}`
      : "AI offline — heuristic check: looks reasonable. No rewrite available without DeepSeek.";
    return { critique, suggestion: null };
  },
};
