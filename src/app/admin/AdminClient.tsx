"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type Whitelist = { id: string; email: string; note: string | null; createdAt: string };
type TeamUser = { id: string; email: string; name: string; role: string; createdAt: string };
type Row = {
  id: string;
  user: { name: string; email: string };
  status: "PRESENT" | "ABSENT";
  currentTask: string | null;
  workingRepo: string | null;
  taskStatus: string | null;
  blockers: string | null;
};
type HistoryRow = Row & { date: string };

const TABS = ["Today", "History", "Members", "Whitelist"] as const;
type Tab = (typeof TABS)[number];

export function AdminClient(props: {
  today: string;
  whitelist: Whitelist[];
  teamUsers: TeamUser[];
  todayRows: Row[];
  history: HistoryRow[];
  latestSummary: { date: string; text: string } | null;
}) {
  const [tab, setTab] = useState<Tab>("Today");

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Admin</h1>
          <p className="text-paper/60 mt-1">Team activity, member management, whitelist.</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-paper/60">Today</div>
          <div className="text-xl font-semibold">{props.today}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-paper/10 mb-8 overflow-x-auto">
        {TABS.map((t) => (
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

      {tab === "Today" && <TodaySection rows={props.todayRows} latestSummary={props.latestSummary} />}
      {tab === "History" && <HistorySection rows={props.history} />}
      {tab === "Members" && <MembersSection users={props.teamUsers} />}
      {tab === "Whitelist" && <WhitelistSection initial={props.whitelist} />}
    </div>
  );
}

function TodaySection({ rows, latestSummary }: { rows: Row[]; latestSummary: { date: string; text: string } | null }) {
  const present = rows.filter((r) => r.status === "PRESENT");
  const absent = rows.filter((r) => r.status === "ABSENT");

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Present" value={present.length} accent="moss" />
        <Stat label="Absent" value={absent.length} accent="accent" />
        <Stat label="Total team" value={rows.length} accent="mist" />
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Today's check-ins</h2>
        {present.length === 0 ? (
          <p className="text-paper/60 text-sm">No check-ins yet. Cron will mark missing members ABSENT at 06:30 UTC.</p>
        ) : (
          <div className="space-y-3">
            {present.map((r) => (
              <div key={r.id} className="border border-paper/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.user.name}</div>
                    <div className="text-xs text-paper/50">{r.user.email}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-moss/20 text-moss">
                    {r.taskStatus || "Present"}
                  </span>
                </div>
                {r.currentTask && (
                  <div className="mt-3 text-sm">
                    <span className="text-paper/50">Task:</span> {r.currentTask}
                  </div>
                )}
                {r.workingRepo && (
                  <div className="mt-1 text-sm">
                    <span className="text-paper/50">Repo:</span>{" "}
                    <a
                      href={r.workingRepo.startsWith("http") ? r.workingRepo : `https://${r.workingRepo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline break-all"
                    >
                      {r.workingRepo}
                    </a>
                  </div>
                )}
                {r.blockers && (
                  <div className="mt-1 text-sm">
                    <span className="text-paper/50">Blockers:</span> {r.blockers}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {absent.length > 0 && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-paper/50 mb-2">Marked absent today</div>
            <div className="flex flex-wrap gap-2">
              {absent.map((r) => (
                <span key={r.id} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                  {r.user.name || r.user.email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {latestSummary && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-1">Latest daily summary</h2>
          <div className="text-xs text-paper/50 mb-3">{latestSummary.date}</div>
          <pre className="whitespace-pre-wrap text-sm font-sans">{latestSummary.text}</pre>
        </div>
      )}
    </section>
  );
}

function HistorySection({ rows }: { rows: HistoryRow[] }) {
  // group by date
  const byDate: Record<string, HistoryRow[]> = {};
  for (const r of rows) {
    (byDate[r.date] ||= []).push(r);
  }
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">Last 30 days</h2>
      {dates.length === 0 ? (
        <p className="text-paper/60 text-sm">No records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-paper/50 border-b border-paper/10">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Member</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Task</th>
                <th className="py-2 pr-3">Repo</th>
                <th className="py-2 pr-3">Blockers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-paper/5 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-paper/70">{r.date}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.user.name}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={clsx(
                        "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                        r.status === "PRESENT"
                          ? "bg-moss/20 text-moss"
                          : "bg-accent/10 text-accent"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{r.currentTask || "—"}</td>
                  <td className="py-2 pr-3 max-w-[180px] truncate" title={r.workingRepo || ""}>
                    {r.workingRepo ? (
                      <a
                        href={r.workingRepo.startsWith("http") ? r.workingRepo : `https://${r.workingRepo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        {r.workingRepo}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pr-3 max-w-[260px]">{r.blockers || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MembersSection({ users }: { users: TeamUser[] }) {
  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">Team members ({users.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-paper/50 border-b border-paper/10">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-paper/5">
                <td className="py-2 pr-3">{u.name}</td>
                <td className="py-2 pr-3 text-paper/70">{u.email}</td>
                <td className="py-2 pr-3">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-paper/10">
                    {u.role}
                  </span>
                </td>
                <td className="py-2 pr-3 text-paper/60">{u.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WhitelistSection({ initial }: { initial: Whitelist[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Failed");
      return;
    }
    const { row } = await res.json();
    setItems((prev) => {
      const exists = prev.find((p) => p.email === row.email);
      if (exists) return prev.map((p) => (p.email === row.email ? row : p));
      return [...prev, row];
    });
    setEmail("");
    setNote("");
    router.refresh();
  }

  async function remove(email: string) {
    if (!confirm(`Remove ${email} from whitelist?`)) return;
    const res = await fetch("/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed");
      return;
    }
    setItems((prev) => prev.filter((p) => p.email !== email));
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-1">Add to whitelist</h2>
        <p className="text-paper/60 text-sm mb-4">
          Only whitelisted emails can sign up as Team members.
        </p>
        <form onSubmit={add} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            className="input"
            placeholder="anish@lucidly.app"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="note (optional, e.g. Co-founder)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button disabled={busy} className="btn-primary">
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
        {err && <p className="text-accent text-sm mt-3">{err}</p>}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Whitelist ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-paper/60 text-sm">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-paper/50 border-b border-paper/10">
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Note</th>
                  <th className="py-2 pr-3">Added</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-b border-paper/5">
                    <td className="py-2 pr-3">{w.email}</td>
                    <td className="py-2 pr-3 text-paper/70">{w.note || "—"}</td>
                    <td className="py-2 pr-3 text-paper/60">{w.createdAt.slice(0, 10)}</td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={() => remove(w.email)}
                        className="text-xs text-accent hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "moss" | "accent" | "mist" }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-paper/50">{label}</div>
      <div className={clsx("text-3xl font-semibold mt-2", accent === "moss" && "text-moss", accent === "accent" && "text-accent")}>
        {value}
      </div>
    </div>
  );
}
