"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "DONE_PERFECT";
type Item = {
  id: string;
  rank: number;
  title: string;
  owner: string | null;
  revenueWhy: string;
  perfectWhen: string;
  status: Status;
};
type Settings = { northStar: string | null; weekGoal: string | null };
type Focus = { date: string; recap: string | null; items: Item[] };

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  NOT_STARTED: { label: "Not started", cls: "bg-paper/10 text-paper/60" },
  IN_PROGRESS: { label: "In progress", cls: "bg-mist/30 text-moss" },
  DONE_PERFECT: { label: "Done — perfection", cls: "bg-moss/20 text-moss" },
};
const STATUS_ORDER: Status[] = ["NOT_STARTED", "IN_PROGRESS", "DONE_PERFECT"];

async function api(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return null;
  const j = await res.json().catch(() => ({}));
  return j.error || "Something went wrong";
}

export function TheThree({
  settings,
  focus,
  role,
}: {
  settings: Settings;
  focus: Focus;
  role: "TEAM" | "USER" | "ADMIN";
}) {
  const isAdmin = role === "ADMIN";
  const items = [...focus.items].sort((a, b) => a.rank - b.rank);

  return (
    <section className="mb-10 animate-fadeUp">
      <div className="relative rounded-3xl p-8 bg-gradient-to-br from-accent/15 via-ink to-moss/10 border border-paper/10 overflow-hidden">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative space-y-6">
          <Header settings={settings} isAdmin={isAdmin} />

          {items.length === 0 ? (
            <EmptyState isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {items.map((it) => (
                <ItemCard key={it.id} item={it} isAdmin={isAdmin} />
              ))}
            </div>
          )}

          {isAdmin && items.length > 0 && items.length < 3 && <AddItem />}
          {isAdmin && <Recap recap={focus.recap} />}
        </div>
      </div>
    </section>
  );
}

function Header({ settings, isAdmin }: { settings: Settings; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [northStar, setNorthStar] = useState(settings.northStar || "");
  const [weekGoal, setWeekGoal] = useState(settings.weekGoal || "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setErr(null);
    const e = await api("/api/focus/settings", "PUT", { northStar, weekGoal });
    setBusy(false);
    if (e) return setErr(e);
    setEditing(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-paper/60">
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        THE 3 — today
      </div>
      {editing ? (
        <div className="mt-4 space-y-3 max-w-2xl">
          <div>
            <label className="label">North Star (the one number we drive)</label>
            <input className="input" value={northStar} onChange={(e) => setNorthStar(e.target.value)} />
          </div>
          <div>
            <label className="label">This week's revenue goal</label>
            <input className="input" value={weekGoal} onChange={(e) => setWeekGoal(e.target.value)} />
          </div>
          {err && <p className="text-accent text-sm">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-paper/60">
              North Star: <span className="text-paper">{settings.northStar || "—"}</span>
            </div>
            <div className="text-sm text-paper/60 mt-1">
              This week: <span className="text-paper">{settings.weekGoal || "—"}</span>
            </div>
          </div>
          {isAdmin && (
            <button className="text-xs text-accent hover:underline shrink-0" onClick={() => setEditing(true)}>
              Edit goals
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-paper/15 p-6 text-center text-paper/60">
      <p>No focus set for today.</p>
      {isAdmin && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <AddItem />
          <CarryOver />
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, isAdmin }: { item: Item; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [owner, setOwner] = useState(item.owner || "");
  const [revenueWhy, setRevenueWhy] = useState(item.revenueWhy);
  const [perfectWhen, setPerfectWhen] = useState(item.perfectWhen);

  async function setStatus(status: Status) {
    const e = await api("/api/focus/item/status", "PATCH", { id: item.id, status });
    if (e) return alert(e);
    router.refresh();
  }
  async function saveEdit() {
    setBusy(true);
    setErr(null);
    const e = await api("/api/focus/item", "PATCH", { id: item.id, title, owner, revenueWhy, perfectWhen });
    setBusy(false);
    if (e) return setErr(e);
    setEditing(false);
    router.refresh();
  }
  async function remove() {
    if (!confirm("Remove this focus item?")) return;
    const e = await api("/api/focus/item", "DELETE", { id: item.id });
    if (e) return alert(e);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="card space-y-2">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The one thing" />
        <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" />
        <textarea className="input" value={revenueWhy} onChange={(e) => setRevenueWhy(e.target.value)} placeholder="How it moves revenue/sales" rows={2} />
        <textarea className="input" value={perfectWhen} onChange={(e) => setPerfectWhen(e.target.value)} placeholder="Perfection = done when…" rows={2} />
        {err && <p className="text-accent text-sm">{err}</p>}
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy} onClick={saveEdit}>{busy ? "Saving…" : "Save"}</button>
          <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-accent">{item.rank}</span>
          <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
        </div>
      </div>
      {item.owner && <div className="text-xs text-paper/50 mt-1">Owner: {item.owner}</div>}
      <div className="mt-3 text-sm">
        <span className="text-paper/50">Revenue:</span> {item.revenueWhy}
      </div>
      <div className="mt-1 text-sm">
        <span className="text-paper/50">Perfection:</span> {item.perfectWhen}
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={clsx(
              "text-[10px] uppercase tracking-wider px-2 py-1 rounded-full transition",
              item.status === s ? STATUS_META[s].cls : "bg-paper/5 text-paper/40 hover:text-paper"
            )}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-3 flex gap-3 text-xs">
          <button className="text-accent hover:underline" onClick={() => setEditing(true)}>Edit</button>
          <button className="text-paper/50 hover:text-accent" onClick={remove}>Delete</button>
        </div>
      )}
    </div>
  );
}

function AddItem() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [revenueWhy, setRevenueWhy] = useState("");
  const [perfectWhen, setPerfectWhen] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // AI sharpen state
  const [sharpBusy, setSharpBusy] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);
  const [aiOffline, setAiOffline] = useState(false);
  const [suggestion, setSuggestion] = useState<
    { title: string; revenueWhy: string; perfectWhen: string } | null
  >(null);

  const canSharpen = title.trim() && revenueWhy.trim() && perfectWhen.trim() && !sharpBusy;

  async function sharpen() {
    setSharpBusy(true);
    setErr(null);
    setCritique(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: "sharpen-focus-item",
          input: { title, revenueWhy, perfectWhen },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Sharpen failed");
        return;
      }
      const { source, data } = await res.json();
      setAiOffline(source === "fallback");
      setCritique(data.critique ?? null);
      setSuggestion(data.suggestion ?? null);
    } finally {
      setSharpBusy(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setTitle(suggestion.title);
    setRevenueWhy(suggestion.revenueWhy);
    setPerfectWhen(suggestion.perfectWhen);
    setSuggestion(null);
    setCritique(null);
  }

  async function add() {
    setBusy(true);
    setErr(null);
    const e = await api("/api/focus/item", "POST", { title, owner, revenueWhy, perfectWhen });
    setBusy(false);
    if (e) return setErr(e);
    setTitle(""); setOwner(""); setRevenueWhy(""); setPerfectWhen("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <button className="btn-ghost" onClick={() => setOpen(true)}>+ Add a focus item</button>;
  }
  return (
    <div className="card w-full max-w-2xl space-y-2 text-left">
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The one thing" />
      <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner (optional)" />
      <textarea className="input" value={revenueWhy} onChange={(e) => setRevenueWhy(e.target.value)} placeholder="How it moves revenue/sales (required)" rows={2} />
      <textarea className="input" value={perfectWhen} onChange={(e) => setPerfectWhen(e.target.value)} placeholder="Perfection = done when… (required)" rows={2} />
      {err && <p className="text-accent text-sm">{err}</p>}

      {critique && (
        <div className="rounded-xl border border-paper/15 bg-paper/5 p-3 text-sm space-y-2">
          <div className="text-xs uppercase tracking-wider text-paper/50">
            {aiOffline ? "AI offline — heuristic" : "Sharpen"}
          </div>
          <p className="whitespace-pre-wrap text-paper/80">{critique}</p>
          {suggestion && (
            <div className="space-y-1 border-t border-paper/10 pt-2">
              <div><span className="text-paper/50">Title:</span> {suggestion.title}</div>
              <div><span className="text-paper/50">Revenue:</span> {suggestion.revenueWhy}</div>
              <div><span className="text-paper/50">Perfection:</span> {suggestion.perfectWhen}</div>
              <button className="btn-ghost mt-1" onClick={applySuggestion}>Apply suggestion</button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy} onClick={add}>{busy ? "Adding…" : "Add"}</button>
        <button
          className="btn-ghost"
          disabled={!canSharpen}
          title={canSharpen ? "" : "Fill title, revenue, and perfection first"}
          onClick={sharpen}
        >
          {sharpBusy ? "Sharpening…" : "Sharpen with AI"}
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function CarryOver() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function carry() {
    setBusy(true);
    const e = await api("/api/focus/carry-over", "POST");
    setBusy(false);
    if (e) return alert(e);
    router.refresh();
  }
  return (
    <button className="btn-ghost" disabled={busy} onClick={carry}>
      {busy ? "Carrying…" : "Carry over unfinished from last time"}
    </button>
  );
}

function Recap({ recap }: { recap: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(recap || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true);
    setSaved(false);
    const e = await api("/api/focus/recap", "PUT", { recap: value });
    setBusy(false);
    if (e) return alert(e);
    setSaved(true);
    router.refresh();
  }
  return (
    <div className="border-t border-paper/10 pt-4">
      <label className="label">End-of-day recap — did we nail the 3?</label>
      <textarea className="input" rows={2} value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }} />
      <div className="mt-2 flex items-center gap-3">
        <button className="btn-ghost" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save recap"}</button>
        {saved && <span className="text-xs text-moss">Saved</span>}
      </div>
    </div>
  );
}
