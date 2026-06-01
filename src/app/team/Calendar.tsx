"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

type Mark = { status: "PRESENT" | "ABSENT"; currentTask?: string | null };

export function Calendar({
  year,
  month, // 0-indexed
  marks,
}: {
  year: number;
  month: number;
  marks: Record<string, Mark>;
}) {
  const router = useRouter();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const days = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1));
    const last = new Date(Date.UTC(year, month + 1, 0));
    const leading = first.getUTCDay(); // 0=Sun
    const total = last.getUTCDate();
    const cells: { key: string; day: number | null; iso: string | null }[] = [];
    for (let i = 0; i < leading; i++) cells.push({ key: `lead-${i}`, day: null, iso: null });
    for (let d = 1; d <= total; d++) {
      const iso = new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10);
      cells.push({ key: iso, day: d, iso });
    }
    return cells;
  }, [year, month]);

  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function onClickDay(iso: string | null) {
    if (!iso) return;
    if (iso === todayKey) {
      setSelected(iso);
      return;
    }
    if (iso < todayKey) {
      setToast(`Past date locked — {${iso}} can't be marked retroactively.`);
    } else {
      setToast(`Future date locked — {${todayKey}} entries valid only.`);
    }
    setTimeout(() => setToast(null), 2400);
  }

  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <Legend />
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-paper/50 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((c) => {
          if (!c.iso) return <div key={c.key} className="aspect-square" />;
          const mark = marks[c.iso];
          const isToday = c.iso === todayKey;
          const isPast = c.iso < todayKey;
          const isFuture = c.iso > todayKey;
          return (
            <button
              key={c.key}
              onClick={() => onClickDay(c.iso)}
              className={clsx(
                "relative aspect-square rounded-xl border text-sm flex items-center justify-center transition",
                isToday && "border-accent text-paper animate-ringPulse",
                !isToday && "border-paper/10 hover:border-paper/30",
                isPast && !mark && "opacity-70",
                isFuture && "opacity-40 cursor-not-allowed",
                mark?.status === "PRESENT" && "bg-moss/20 border-moss/60",
                mark?.status === "ABSENT" && "bg-accent/10 border-accent/40"
              )}
              title={mark?.currentTask || ""}
            >
              <span>{c.day}</span>
              {mark?.status === "PRESENT" && (
                <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-moss" />
              )}
              {mark?.status === "ABSENT" && (
                <span className="absolute bottom-1 right-1 text-accent text-[10px] font-bold">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {toast && (
        <div className="mt-4 text-sm text-accent animate-fadeUp">{toast}</div>
      )}

      {selected && (
        <CheckInModal
          iso={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-paper/60">
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-moss" /> Present
      </span>
      <span className="flex items-center gap-1">
        <span className="text-accent">✕</span> Absent
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> Today
      </span>
    </div>
  );
}

function CheckInModal({
  iso,
  onClose,
  onSaved,
}: {
  iso: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    currentTask: "",
    workingRepo: "",
    taskStatus: "In progress",
    blockers: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, date: iso }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Failed to save");
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-md flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg bg-white border-paper/15 shadow-2xl animate-fadeUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent">Check-in</div>
            <h3 className="text-xl font-semibold">{iso}</h3>
          </div>
          <button onClick={onClose} className="text-paper/60 hover:text-paper">✕</button>
        </div>

        <label className="label">Current Task</label>
        <input className="input mb-3" value={form.currentTask}
               onChange={(e) => setForm({ ...form, currentTask: e.target.value })}
               placeholder="e.g., Wiring the Discord webhook" required />

        <label className="label">Working Repo / Doc</label>
        <input className="input mb-3" value={form.workingRepo}
               onChange={(e) => setForm({ ...form, workingRepo: e.target.value })}
               placeholder="github.com/lucidly/teamdesk or notion link" />

        <label className="label">Status</label>
        <select className="input mb-3" value={form.taskStatus}
                onChange={(e) => setForm({ ...form, taskStatus: e.target.value })}>
          <option>Planning</option>
          <option>In progress</option>
          <option>Review</option>
          <option>Shipped</option>
          <option>Blocked</option>
        </select>

        <label className="label">Dependencies / Blockers</label>
        <textarea className="input mb-4 min-h-[80px]" value={form.blockers}
                  onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                  placeholder="Anything in your way? Anyone you need?" />

        {err && <p className="text-accent text-sm mb-3">{err}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving || !form.currentTask} className="btn-primary">
            {saving ? "Marking…" : "Mark done & submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
