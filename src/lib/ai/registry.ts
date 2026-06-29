import type { AiSkill } from "./types";
import { sharpenFocusItem } from "./skills/sharpen-focus-item";

// Server-only registry of runnable AI skills. Add a skill here to expose it via
// POST /api/ai/run. The route enforces each skill's declared role.
export const SKILLS: Record<string, AiSkill<any, any>> = {
  [sharpenFocusItem.name]: sharpenFocusItem,
};
