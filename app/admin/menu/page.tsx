"use client";

import { useEffect, useState, useCallback } from "react";
import type { MenuItem } from "@/app/lib/types";

type Draft = Omit<MenuItem, "id">;

const emptyDraft: Draft = {
  slug: "",
  name: "",
  description: "",
  image: "",
  emoji: "🍰",
  sortOrder: 0,
  active: true,
  featured: false,
};

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu", { cache: "no-store" });
      setItems(await res.json());
    } catch {
      setNote({ type: "err", msg: "Failed to load menu" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patch(id: number, field: keyof MenuItem, value: unknown) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  async function save(item: MenuItem) {
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json().catch(() => ({}));
    setNote(
      res.ok
        ? { type: "ok", msg: `Saved "${item.name}"` }
        : { type: "err", msg: data.error || "Save failed" }
    );
  }

  async function remove(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const res = await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNote({ type: "ok", msg: `Deleted "${item.name}"` });
    } else {
      setNote({ type: "err", msg: "Delete failed" });
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setDraft(emptyDraft);
        setNote({ type: "ok", msg: `Added "${data.name}"` });
      } else {
        setNote({ type: "err", msg: data.error || "Failed to add item" });
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <h1 className="admin-h1">Menu</h1>
      <p className="admin-sub">
        Add, edit, reorder, or hide items. Use the order field to control how items appear.
      </p>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      {/* Add new */}
      <div className="admin-card">
        <h2>Add a new item</h2>
        <form onSubmit={add}>
          <div className="admin-row">
            <div className="admin-field">
              <label>Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Pistachio Baklava"
              />
            </div>
            <div className="admin-field" style={{ maxWidth: 90, flex: "0 0 90px" }}>
              <label>Emoji</label>
              <input
                value={draft.emoji}
                onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
              />
            </div>
            <div className="admin-field" style={{ maxWidth: 110, flex: "0 0 110px" }}>
              <label>Order</label>
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="admin-field">
            <label>Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Image URL (optional)</label>
            <input
              value={draft.image || ""}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="/images/your-photo.jpg or https://…"
            />
          </div>
          <button className="admin-btn" disabled={adding}>
            {adding ? "Adding…" : "Add item"}
          </button>
        </form>
      </div>

      {/* Existing */}
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
              <div className="admin-row">
                <div className="admin-field">
                  <label>Name</label>
                  <input
                    value={item.name}
                    onChange={(e) => patch(item.id, "name", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ maxWidth: 80, flex: "0 0 80px" }}>
                  <label>Emoji</label>
                  <input
                    value={item.emoji}
                    onChange={(e) => patch(item.id, "emoji", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ maxWidth: 100, flex: "0 0 100px" }}>
                  <label>Order</label>
                  <input
                    type="number"
                    value={item.sortOrder}
                    onChange={(e) => patch(item.id, "sortOrder", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="admin-field">
                <label>Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => patch(item.id, "description", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>Image URL</label>
                <input
                  value={item.image || ""}
                  onChange={(e) => patch(item.id, "image", e.target.value || null)}
                />
              </div>
              <div className="admin-actions">
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}
                >
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={(e) => patch(item.id, "active", e.target.checked)}
                  />
                  Visible on site
                </label>
                <button className="admin-btn" onClick={() => save(item)}>
                  Save
                </button>
                <button className="admin-btn-danger" onClick={() => remove(item)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
