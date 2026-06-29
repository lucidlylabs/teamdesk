import type { DailyFocus, FocusItem, FocusSettings } from "@prisma/client";
import { ymd } from "@/lib/dates";

export const FOCUS_SETTINGS_ID = "singleton";

export function serializeItem(i: FocusItem) {
  return {
    id: i.id,
    rank: i.rank,
    title: i.title,
    owner: i.owner,
    revenueWhy: i.revenueWhy,
    perfectWhen: i.perfectWhen,
    status: i.status,
  };
}

export function serializeFocus(
  date: Date,
  focus: (DailyFocus & { items: FocusItem[] }) | null
) {
  return {
    date: ymd(date),
    recap: focus?.recap ?? null,
    items: (focus?.items ?? []).map(serializeItem),
  };
}

export function serializeSettings(s: FocusSettings | null) {
  return { northStar: s?.northStar ?? null, weekGoal: s?.weekGoal ?? null };
}
