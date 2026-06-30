"use client";

import { useEffect, useState, useCallback } from "react";
import type { MenuItem } from "@/app/lib/types";

export default function FeaturedManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu", { cache: "no-store" });
      setItems(await res.json());
    } catch {
      setNote({ type: "err", msg: "Failed to load items" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: MenuItem, featured: boolean) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, featured } : i)));
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    });
    setNote(
      res.ok
        ? { type: "ok", msg: `"${item.name}" ${featured ? "added to" : "removed from"} the carousel.` }
        : { type: "err", msg: "Save failed" }
    );
  }

  const count = items.filter((i) => i.featured).length;

  return (
    <div className="admin-card">
      <h2>Our Favourites (carousel)</h2>
      <p className="order-meta" style={{ marginBottom: 12 }}>
        Pick which items scroll in the auto-playing &ldquo;Freshly baked treats&rdquo; carousel on
        the home page. {count} selected.
      </p>
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}
      {loading ? (
        <p className="order-meta">Loading…</p>
      ) : (
        items.map((item) => (
          <div className="menu-admin-item" key={item.id}>
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="menu-admin-thumb" src={item.image} alt={item.name} />
            ) : (
              <div className="menu-admin-thumb">{item.emoji}</div>
            )}
            <div style={{ flex: 1 }}>
              <strong>{item.name}</strong>
              {!item.active && <span className="order-meta"> · hidden from menu</span>}
            </div>
            <label
              style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              <input
                type="checkbox"
                checked={item.featured}
                onChange={(e) => toggle(item, e.target.checked)}
              />
              In carousel
            </label>
          </div>
        ))
      )}
    </div>
  );
}
