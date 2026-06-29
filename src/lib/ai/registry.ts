import type { AiSkill } from "./types";
import { sharpenFocusItem } from "./skills/sharpen-focus-item";
import { officeHours } from "./skills/office-hours";
import { ceoReviewThe3 } from "./skills/ceo-review-the-3";
import { weeklyReview } from "./skills/weekly-review";

// Server-only registry of runnable AI skills. Add a skill here to expose it via
// POST /api/ai/run. The route enforces each skill's declared role.
export const SKILLS: Record<string, AiSkill<any, any>> = {
  [sharpenFocusItem.name]: sharpenFocusItem,
  [officeHours.name]: officeHours,
  [ceoReviewThe3.name]: ceoReviewThe3,
  [weeklyReview.name]: weeklyReview,
};
