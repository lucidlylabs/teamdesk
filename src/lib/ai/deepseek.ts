// Thin DeepSeek (OpenAI-compatible) JSON client. Generalizes the call pattern in
// src/lib/summarize.ts so AI skills don't each re-implement it.

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

/** True when a DeepSeek key is configured. Skills fall back to deterministic output otherwise. */
export function hasDeepSeek(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

/**
 * Call DeepSeek and return the parsed JSON object from the completion.
 * Throws on missing key, HTTP error, timeout, empty completion, or invalid JSON.
 * Callers (runSkill) catch and fall back — they never surface this to the client.
 */
export async function chatJSON(args: {
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs ?? 20000);
  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: args.temperature ?? 0.5,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`deepseek ${res.status}: ${await res.text().catch(() => "")}`);
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = j.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty completion");
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}
