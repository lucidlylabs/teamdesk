type Embed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
};

async function post(webhook: string | undefined, payload: unknown) {
  if (!webhook) {
    console.warn("[discord] webhook not configured — skipping");
    return { skipped: true };
  }
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord webhook failed (${res.status}): ${text}`);
  }
  return { ok: true };
}

export async function sendDailySummary(opts: {
  date: string;
  summary: string;
  refs?: string[];
}) {
  const embed: Embed = {
    title: `Lucidly — Daily Desk (${opts.date})`,
    description: opts.summary,
    color: 0xff3b30,
    footer: { text: "TeamDesk · auto-relayed" },
    timestamp: new Date().toISOString(),
  };
  if (opts.refs?.length) {
    embed.fields = [
      { name: "References", value: opts.refs.map((r) => `• ${r}`).join("\n") },
    ];
  }
  return post(process.env.DISCORD_DAILY_SUMMARY_WEBHOOK, { embeds: [embed] });
}

export async function sendResearchRelay(opts: {
  title: string;
  url: string;
  notes?: string;
  postedBy?: string;
}) {
  const embed: Embed = {
    title: `📚 ${opts.title}`,
    url: opts.url,
    description: opts.notes ?? "",
    color: 0x3a5a40,
    footer: { text: opts.postedBy ? `posted by ${opts.postedBy}` : "Research" },
    timestamp: new Date().toISOString(),
  };
  return post(process.env.DISCORD_RESEARCH_WEBHOOK, { embeds: [embed] });
}
