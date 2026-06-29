import { chatJSON, hasDeepSeek } from "./deepseek";
import type { AiSkill, PrepareArgs } from "./types";

export type SkillResult<O> = { source: "llm" | "fallback"; data: O };

/**
 * Run a skill: assemble + validate input, call DeepSeek (validating its output
 * as a trust boundary), and fall back deterministically on missing key or any
 * model failure. Throws ONLY on invalid input (the route maps that to 400);
 * AI failures never throw — they become a fallback result.
 */
export async function runSkill<I, O>(
  skill: AiSkill<I, O>,
  clientInput: unknown,
  serverArgs: Omit<PrepareArgs, "clientInput">
): Promise<SkillResult<O>> {
  const prepared = skill.prepare
    ? await skill.prepare({ ...serverArgs, clientInput })
    : {};
  const base = typeof clientInput === "object" && clientInput ? clientInput : {};
  const input = skill.inputSchema.parse({ ...base, ...prepared }); // ZodError -> route 400

  if (!hasDeepSeek()) return { source: "fallback", data: skill.fallback(input) };

  try {
    const raw = await chatJSON({ ...skill.buildMessages(input), temperature: skill.temperature });
    return { source: "llm", data: skill.outputSchema.parse(raw) };
  } catch (e) {
    console.warn(`[ai] ${skill.name} fallback:`, e);
    return { source: "fallback", data: skill.fallback(input) };
  }
}
