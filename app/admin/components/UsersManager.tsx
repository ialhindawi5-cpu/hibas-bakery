"use client";

import { useEffect, useState, useCallback } from "react";
import type { AdminUser } from "@/app/lib/users";

// Admin-user management, shown as a section on the Settings page.
export default function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);

  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPw, setResetPw] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, m] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/me", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setUsers(u);
      setMe(m.username);
    } catch {
      setNote({ type: "err", msg: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers((prev) => [...prev, data]);
        setNewUsername("");
        setNewPassword("");
        setNote({ type: "ok", msg: `Admin user "${data.username}" created.` });
      } else {
        setNote({ type: "err", msg: data.error || "Failed to create user" });
      }
    } finally {
      setAdding(false);
    }
  }

  async function resetPassword(u: AdminUser) {
    if (resetPw.length < 8) {
      setNote({ type: "err", msg: "Password must be at least 8 characters." });
      return;
    }
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPw }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResetId(null);
      setResetPw("");
      setNote({ type: "ok", msg: `Password reset for "${u.username}".` });
    } else {
      setNote({ type: "err", msg: data.error || "Reset failed" });
    }
  }

  async function remove(u: AdminUser) {
    if (!confirm(`Delete admin user "${u.username}"?`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setNote({ type: "ok", msg: `Deleted "${u.username}".` });
    } else {
      setNote({ type: "err", msg: data.error || "Delete failed" });
    }
  }

  return (
    <div className="admin-card">
      <h2>Admin users</h2>
      <p className="order-meta" style={{ marginBottom: 12 }}>
        People who can sign in to this dashboard. Add users, reset passwords, or remove access.
      </p>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      <form onSubmit={add} style={{ marginBottom: 18 }}>
        <div className="admin-row">
          <div className="admin-field">
            <label>New username</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. sara"
              autoComplete="off"
            />
          </div>
          <div className="admin-field">
            <label>Password</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="at least 8 characters"
              autoComplete="new-password"
            />
          </div>
        </div>
        <button className="admin-btn" disabled={adding}>
          {adding ? "Adding…" : "Create user"}
        </button>
      </form>

      {loading ? (
        <p className="order-meta">Loading…</p>
      ) : (
        users.map((u) => (
          <div className="user-row" key={u.id}>
            <div>
              <strong>{u.username}</strong>
              {me === u.username && <span className="user-you">you</span>}
              <div className="order-meta">Added {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>

            {resetId === u.id ? (
              <div className="admin-actions">
                <input
                  type="text"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="new password"
                  autoComplete="new-password"
                  style={{ maxWidth: 200 }}
                />
                <button className="admin-btn" onClick={() => resetPassword(u)}>
                  Save
                </button>
                <button
                  className="admin-btn-sec"
                  onClick={() => {
                    setResetId(null);
                    setResetPw("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="admin-actions">
                <button
                  className="admin-btn-sec"
                  onClick={() => {
                    setResetId(u.id);
                    setResetPw("");
                  }}
                >
                  Reset password
                </button>
                {users.length > 1 && (
                  <button className="admin-btn-danger" onClick={() => remove(u)}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
