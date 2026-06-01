"use client";
import { useState } from "react";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword.length < 8) return setMsg({ kind: "err", text: "New password must be at least 8 characters." });
    if (newPassword !== confirm) return setMsg({ kind: "err", text: "New passwords do not match." });

    setSaving(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return setMsg({ kind: "err", text: j.error || "Failed to update password." });
    }
    setMsg({ kind: "ok", text: "Password updated." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">Current password</label>
        <input className="input" type="password" value={currentPassword}
               onChange={(e) => setCurrentPassword(e.target.value)} required />
      </div>
      <div>
        <label className="label">New password</label>
        <input className="input" type="password" value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input className="input" type="password" value={confirm}
               onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </div>

      {msg && (
        <p className={"text-sm " + (msg.kind === "ok" ? "text-moss" : "text-accent")}>{msg.text}</p>
      )}

      <button disabled={saving} className="btn-primary">
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
