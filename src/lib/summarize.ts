import { Attendance, User } from "@prisma/client";

type Row = Attendance & { user: Pick<User, "name" | "email"> };

/**
 * Deterministic fallback summary — used when no LLM key is set or the LLM call errors.
 * Kept as a function so we can always recover without external dependencies.
 */
export function buildTemplateSummary(rows: Row[]): { summary: string; refs: string[] } {
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

/**
 * Call DeepSeek (OpenAI-compatible) to write a punchy 4-line summary.
 * Falls back to the template if no key, or any error.
 */
export async function generateDailySummary(
  rows: Row[]
): Promise<{ summary: string; refs: string[]; source: "llm" | "template" }> {
  const fallback = buildTemplateSummary(rows);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { ...fallback, source: "template" };

  // Build a compact, factual digest for the LLM to riff on.
  const present = rows.filter((r) => r.status === "PRESENT");
  const absent = rows.filter((r) => r.status === "ABSENT");
  const facts = {
    presentCount: present.length,
    absentCount: absent.length,
    present: present.map((r) => ({
      name: r.user.name,
      task: r.currentTask,
      repo: r.workingRepo,
      status: r.taskStatus,
      blockers: r.blockers,
    })),
    absent: absent.map((r) => r.user.name),
  };

  const system = `You write a punchy 4-line daily summary for an early-stage startup's "TeamDesk".
Voice: confident, modern founder energy. A touch of wit but never cringey.
Each line should be a single sentence. Use 1 emoji per line max. Don't lecture; observe.
Cover, in this order:
1) Who showed up + general vibe
2) The most interesting work in flight
3) Blockers if any (or celebrate clean runway)
4) Absentees in a light-hearted but pointed way (it's how we reinforce consistency)
Never invent names or facts not in the provided JSON. Output ONLY the 4 lines, separated by single newlines. No preamble.`;

  const user = `Today's check-ins (JSON):
${JSON.stringify(facts, null, 2)}

Write the 4-line summary.`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`deepseek ${res.status}: ${await res.text().catch(() => "")}`);
    const j = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = j.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty completion");
    // refs come from the deterministic side — always include unique repos seen today
    return { summary: text, refs: fallback.refs, source: "llm" };
  } catch (e) {
    console.warn("[summarize] LLM failed, using template:", e);
    return { ...fallback, source: "template" };
  }
}

// Back-compat: keep the original name as a thin sync wrapper for any old callers.
export const buildDailySummary = buildTemplateSummary;
