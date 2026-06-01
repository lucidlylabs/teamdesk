import { Attendance, User } from "@prisma/client";

type Row = Attendance & { user: Pick<User, "name" | "email"> };

/**
 * Produce a 4-line catchy summary from the day's attendance rows.
 * Deterministic, no external LLM needed. Replace with an LLM call later if desired.
 */
export function buildDailySummary(rows: Row[]): { summary: string; refs: string[] } {
  const present = rows.filter((r) => r.status === "PRESENT");
  const absent = rows.filter((r) => r.status === "ABSENT");
  const blockers = present.filter((r) => r.blockers && r.blockers.trim().length > 0);
  const repos = Array.from(
    new Set(present.map((r) => r.workingRepo).filter(Boolean) as string[])
  );

  const line1 = present.length
    ? `🔥 ${present.length} on the desk today — ${present
        .slice(0, 4)
        .map((r) => r.user.name.split(" ")[0])
        .join(", ")}${present.length > 4 ? " +more" : ""} shipped progress.`
    : "🌙 Quiet day on the desk — no check-ins logged yet.";

  const topTasks = present
    .map((r) => r.currentTask)
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
  const line2 = topTasks
    ? `🛠  In flight: ${topTasks}.`
    : "🛠  No active tasks reported.";

  const line3 = blockers.length
    ? `⚠️  ${blockers.length} blocker${blockers.length > 1 ? "s" : ""} surfaced — "${
        blockers[0].blockers!.slice(0, 90)
      }${blockers[0].blockers!.length > 90 ? "…" : ""}"`
    : "✅ Zero blockers — clean runway.";

  const line4 = absent.length
    ? `🫥 ${absent.length} marked absent (consistency points pending).`
    : `🚀 Full attendance — the lock-in is real.`;

  const refs = repos.slice(0, 5);
  return { summary: [line1, line2, line3, line4].join("\n"), refs };
}
