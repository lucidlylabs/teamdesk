"use client";
import { useState } from "react";
import clsx from "clsx";

type Summary = { date: string; text: string; refs: string[] } | null;
type Pipeline = {
  id: string; title: string; workingRepo: string | null; summary: string;
  done: number; total: number; status: string;
};
type Research = {
  id: string; title: string; url: string; notes: string | null;
  postedBy: string | null; createdAt: string;
};
type FocusItem = {
  id: string; rank: number; title: string; owner: string | null;
  revenueWhy: string; perfectWhen: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE_PERFECT";
};
type FocusLogDay = { date: string; recap: string | null; items: FocusItem[] };

export function DeskTabs({
  summary, pipelines, research, focusLog,
}: {
  summary: Summary; pipelines: Pipeline[]; research: Research[];
  focusLog: FocusLogDay[] | null;
}) {
  const tabs = ["From the Desk", "Product Pipelines", "Research", ...(focusLog ? ["Focus Log"] : [])];
  const [tab, setTab] = useState<string>("From the Desk");

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-paper/10 mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition",
              tab === t ? "border-accent text-paper" : "border-transparent text-paper/50 hover:text-paper"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "From the Desk" && <FromTheDesk summary={summary} />}
      {tab === "Product Pipelines" && <Pipelines items={pipelines} />}
      {tab === "Research" && <ResearchFeed items={research} />}
      {tab === "Focus Log" && focusLog && <FocusLog days={focusLog} />}
    </div>
  );
}

const STATUS_LABEL: Record<FocusItem["status"], { label: string; cls: string }> = {
  NOT_STARTED: { label: "Not started", cls: "bg-paper/10 text-paper/60" },
  IN_PROGRESS: { label: "In progress", cls: "bg-mist/30 text-moss" },
  DONE_PERFECT: { label: "Done", cls: "bg-moss/20 text-moss" },
};

function FocusLog({ days }: { days: FocusLogDay[] }) {
  return (
    <section className="space-y-4 animate-fadeUp">
      {days.length === 0 && <div className="card text-paper/60">No focus history yet.</div>}
      {days.map((d) => {
        const done = d.items.filter((i) => i.status === "DONE_PERFECT").length;
        return (
          <div key={d.date} className="card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{d.date}</h3>
              <span className="text-xs text-paper/50">
                {done}/{d.items.length} done-to-perfection
              </span>
            </div>
            {d.items.length === 0 ? (
              <p className="text-sm text-paper/50 mt-2">No focus set this day.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {d.items.map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-sm">
                    <span className="text-accent font-semibold">{i.rank}</span>
                    <span className="flex-1">{i.title}</span>
                    <span className={clsx("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0", STATUS_LABEL[i.status].cls)}>
                      {STATUS_LABEL[i.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {d.recap && (
              <div className="mt-3 text-sm text-paper/70 border-t border-paper/10 pt-3">
                <span className="text-paper/50">Recap:</span> {d.recap}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function FromTheDesk({ summary }: { summary: Summary }) {
  return (
    <section className="space-y-6">
      <div className="relative rounded-3xl p-8 bg-gradient-to-br from-accent/20 via-ink to-moss/10 border border-paper/10 overflow-hidden animate-fadeUp">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-moss/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-paper/60">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            {summary ? `Daily wire · ${summary.date}` : "Daily wire"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold mt-3 leading-tight">
            From the Desk
          </h2>
          {summary ? (
            <pre className="whitespace-pre-wrap mt-6 text-lg text-paper/90 font-sans leading-relaxed">
              {summary.text}
            </pre>
          ) : (
            <p className="text-paper/60 mt-4">
              No summary yet today. The team is still warming up.
            </p>
          )}
          {summary?.refs?.length ? (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-paper/50 mb-2">References</div>
              <ul className="space-y-1 text-sm">
                {summary.refs.map((r) => (
                  <li key={r}>
                    <a className="text-accent hover:underline break-all" href={r.startsWith("http") ? r : `https://${r}`} target="_blank" rel="noreferrer">
                      {r}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Pipelines({ items }: { items: Pipeline[] }) {
  return (
    <section className="grid sm:grid-cols-2 gap-4 animate-fadeUp">
      {items.length === 0 && (
        <div className="card col-span-full text-paper/60">No pipelines yet.</div>
      )}
      {items.map((p) => {
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
        return (
          <div key={p.id} className="card hover:border-accent/40 transition">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-paper/10">
                {p.status}
              </span>
            </div>
            {p.workingRepo && (
              <a href={p.workingRepo} target="_blank" rel="noreferrer"
                 className="text-xs text-accent hover:underline break-all mt-1 inline-block">
                {p.workingRepo}
              </a>
            )}
            <p className="text-sm text-paper/70 mt-3">{p.summary}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-paper/60 mb-1">
                <span>{p.done}/{p.total} tasks</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-paper/10 overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ResearchFeed({ items }: { items: Research[] }) {
  return (
    <section className="space-y-3 animate-fadeUp">
      {items.length === 0 && <div className="card text-paper/60">No research posts yet.</div>}
      {items.map((r) => (
        <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
           className="block card hover:border-accent/40 transition">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">{r.title}</h3>
            <span className="text-xs text-paper/50">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs text-accent mt-1 break-all">{r.url}</div>
          {r.notes && <p className="text-sm text-paper/70 mt-2">{r.notes}</p>}
          {r.postedBy && (
            <div className="text-[11px] uppercase tracking-wider text-paper/40 mt-2">
              posted by {r.postedBy}
            </div>
          )}
        </a>
      ))}
    </section>
  );
}
