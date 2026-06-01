"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" as "TEAM" | "USER" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Sign up failed");
      setLoading(false);
      return;
    }
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (!login || login.error) {
      router.push("/signin");
      return;
    }
    router.push("/post-signin");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <form onSubmit={onSubmit} className="w-full max-w-md card animate-fadeUp">
        <h1 className="text-2xl font-semibold mb-1">Join the desk</h1>
        <p className="text-paper/60 text-sm mb-6">Team members need a whitelisted email.</p>

        <label className="label">Name</label>
        <input className="input mb-4" value={form.name} onChange={(e) => set("name", e.target.value)} required />

        <label className="label">Email</label>
        <input className="input mb-4" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />

        <label className="label">Password (min 8)</label>
        <input className="input mb-4" type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} required />

        <label className="label">I am a…</label>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(["TEAM", "USER"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => set("role", r)}
              className={`rounded-lg border p-4 text-left transition ${
                form.role === r
                  ? "border-accent bg-accent/10"
                  : "border-paper/15 hover:border-paper/40"
              }`}
            >
              <div className="text-sm font-medium">{r === "TEAM" ? "Team member" : "Lucidly user"}</div>
              <div className="text-xs text-paper/60 mt-1">
                {r === "TEAM"
                  ? "Mark attendance, log daily progress."
                  : "Read From the Desk, Pipelines, Research."}
              </div>
            </button>
          ))}
        </div>

        {err && <p className="text-accent text-sm mb-4">{err}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-sm text-paper/60 mt-4 text-center">
          Already have one?{" "}
          <Link className="text-accent hover:underline" href="/signin">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
