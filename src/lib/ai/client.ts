// Client-side helper to invoke an AI skill via the single entry point.
// Returns { source, data } on success or { error } on failure (never throws).
export type SkillResponse<T> = { source: "llm" | "fallback"; data: T } | { error: string };

export async function runSkillClient<T = any>(skill: string, input: unknown): Promise<SkillResponse<T>> {
  try {
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, input }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { error: j.error || `AI request failed (${res.status})` };
    }
    return await res.json();
  } catch {
    return { error: "Network error" };
  }
}
