"use client";

import { useEffect, useState, useCallback } from "react";
import type { Message } from "@/app/lib/messages";

export default function AdminMessages() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load messages");
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setRead(m: Message, read: boolean) {
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)));
    await fetch(`/api/admin/messages/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
  }

  async function remove(m: Message) {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== m.id));
  }

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const unread = items.filter((m) => !m.read).length;

  return (
    <>
      <h1 className="admin-h1">Messages</h1>
      <p className="admin-sub">
        Messages sent through the contact form. They&apos;re also emailed to you.
      </p>

      <div className="admin-actions" style={{ marginBottom: 18 }}>
        <button className="admin-btn-sec" onClick={load}>
          ↻ Refresh
        </button>
        <span className="order-meta">
          {items.length} message(s){unread > 0 ? ` · ${unread} unread` : ""}
        </span>
      </div>

      {error && <div className="admin-note err">{error}</div>}
      {loading && <p className="order-meta">Loading…</p>}

      {!loading && items.length === 0 && !error && (
        <div className="admin-card">
          <p className="order-meta">No messages yet.</p>
        </div>
      )}

      {items.map((m) => (
        <div className="order-card" key={m.id} style={{ opacity: m.read ? 0.75 : 1 }}>
          <div className="order-head">
            <div>
              <span className="order-name">{m.name || "Anonymous"}</span>{" "}
              {!m.read && <span className="badge new">new</span>}
              <div className="order-meta">
                {m.email && <span>{m.email} · </span>}
                {m.phone && <span>{m.phone} · </span>}
                {fmt(m.createdAt)}
              </div>
            </div>
          </div>
          <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 12px" }}>{m.message}</p>
          <div className="admin-actions">
            {m.email && (
              <a className="admin-btn-sec" href={`mailto:${m.email}`}>
                Reply
              </a>
            )}
            <button className="admin-btn-sec" onClick={() => setRead(m, !m.read)}>
              {m.read ? "Mark unread" : "Mark read"}
            </button>
            <button className="admin-btn-danger" onClick={() => remove(m)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
