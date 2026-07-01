"use client";

import { useEffect, useState, useCallback } from "react";
import type { HistoryEntry } from "@/app/lib/content";

export default function HistoryManager() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/history", { cache: "no-store" });
      setItems(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveVersion() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        setLabel("");
        setNote({ type: "ok", msg: "Saved the current live version to history." });
        load();
      } else {
        setNote({ type: "err", msg: "Failed to save version" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function republish(v: HistoryEntry) {
    if (!confirm(`Republish "${v.label}"? This makes that version live now.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/history/${v.id}`, { method: "PUT" });
      if (res.ok) {
        setNote({ type: "ok", msg: `Republished "${v.label}" — it's now live.` });
        window.dispatchEvent(new Event("bk:draft-changed"));
        window.dispatchEvent(new Event("bk:draft-reverted"));
      } else {
        setNote({ type: "err", msg: "Republish failed" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(v: HistoryEntry) {
    if (!confirm(`Delete the saved version "${v.label}"?`)) return;
    const res = await fetch(`/api/admin/history/${v.id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== v.id));
  }

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="admin-card">
      <h2>Version history</h2>
      <p className="order-meta" style={{ marginBottom: 12 }}>
        Save a snapshot of the current live site, so you can republish (restore) it later.
      </p>
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      <div className="admin-row" style={{ alignItems: "flex-end" }}>
        <div className="admin-field" style={{ marginBottom: 0 }}>
          <label>Name this version (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Ramadan menu, Summer prices…"
          />
        </div>
        <button className="admin-btn" onClick={saveVersion} disabled={busy}>
          {busy ? "Saving…" : "Save current version"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {items.length === 0 ? (
          <p className="order-meta">No saved versions yet.</p>
        ) : (
          items.map((v) => (
            <div className="user-row" key={v.id}>
              <div>
                <strong>{v.label}</strong>
                <div className="order-meta">Saved {fmt(v.createdAt)}</div>
              </div>
              <div className="admin-actions">
                <button className="admin-btn" onClick={() => republish(v)} disabled={busy}>
                  Republish
                </button>
                <button className="admin-btn-danger" onClick={() => remove(v)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
