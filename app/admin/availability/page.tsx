"use client";

import { useEffect, useState, useCallback } from "react";
import type { Settings } from "@/app/lib/types";

function fmt(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

export default function AdminAvailability() {
  const [slots, setSlots] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState("");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s: Settings = await fetch("/api/admin/settings", { cache: "no-store" }).then((r) =>
        r.json()
      );
      setSlots([...(s.pickupSlots || [])].sort());
      setBlocked([...(s.blockedDates || [])].sort());
    } catch {
      setNote({ type: "err", msg: "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function addSlot() {
    if (!newSlot || slots.includes(newSlot)) return;
    setSlots((p) => [...p, newSlot].sort());
    setNewSlot("");
  }
  function addDate() {
    if (!newDate || blocked.includes(newDate)) return;
    setBlocked((p) => [...p, newDate].sort());
    setNewDate("");
  }

  async function save() {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupSlots: slots, blockedDates: blocked }),
      });
      setNote(
        res.ok
          ? { type: "ok", msg: "Availability saved. Live on the order form." }
          : { type: "err", msg: "Save failed" }
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="order-meta">Loading…</p>;

  return (
    <>
      <h1 className="admin-h1">Pickup Availability</h1>
      <p className="admin-sub">
        Set the pickup time slots customers can choose, and block any dates you&apos;re closed or
        fully booked. The order form only allows open dates and these slots.
      </p>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      <div className="admin-card">
        <h2>Pickup time slots</h2>
        <p className="order-meta" style={{ marginBottom: 12 }}>
          Customers pick one of these times.
        </p>
        <div className="chip-list">
          {slots.map((s) => (
            <span className="chip" key={s}>
              {fmt(s)}
              <button type="button" onClick={() => setSlots((p) => p.filter((x) => x !== s))}>
                ×
              </button>
            </span>
          ))}
          {slots.length === 0 && <span className="order-meta">No slots yet.</span>}
        </div>
        <div className="admin-actions" style={{ marginTop: 12 }}>
          <input
            type="time"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            style={{ maxWidth: 160 }}
          />
          <button type="button" className="admin-btn-sec" onClick={addSlot}>
            + Add slot
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2>Blocked dates</h2>
        <p className="order-meta" style={{ marginBottom: 12 }}>
          Dates customers cannot choose (closed / fully booked).
        </p>
        <div className="chip-list">
          {blocked.map((d) => (
            <span className="chip" key={d}>
              {d}
              <button type="button" onClick={() => setBlocked((p) => p.filter((x) => x !== d))}>
                ×
              </button>
            </span>
          ))}
          {blocked.length === 0 && <span className="order-meta">No blocked dates.</span>}
        </div>
        <div className="admin-actions" style={{ marginTop: 12 }}>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <button type="button" className="admin-btn-sec" onClick={addDate}>
            + Block date
          </button>
        </div>
      </div>

      <button className="admin-btn" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save availability"}
      </button>
    </>
  );
}
