"use client";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) return setErr("Invalid email or password.");
    const from = params.get("from");
    router.push(from || "/post-signin");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md card animate-fadeUp">
        <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
        <p className="text-paper/60 text-sm mb-6">Sign in to the desk.</p>

        <label className="label">Email</label>
        <input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <label className="label">Password</label>
        <input className="input mb-6" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

        {err && <p className="text-accent text-sm mb-4">{err}</p>}

        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-paper/60 mt-4 text-center">
          New here?{" "}
          <Link className="text-accent hover:underline" href="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
