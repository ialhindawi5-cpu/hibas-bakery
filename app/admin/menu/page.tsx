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
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addKey, setAddKey] = useState(0);
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

  async function uploadImage(item: MenuItem, file: File) {
    setNote({ type: "ok", msg: `Uploading photo for "${item.name}"…` });
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/menu/${item.id}/image`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      patch(item.id, "image", data.image);
      setNote({ type: "ok", msg: `Photo updated for "${item.name}"` });
    } else {
      setNote({ type: "err", msg: data.error || "Upload failed" });
    }
  }

  async function removeImage(item: MenuItem) {
    const res = await fetch(`/api/admin/menu/${item.id}/image`, { method: "DELETE" });
    if (res.ok) {
      patch(item.id, "image", null);
      setNote({ type: "ok", msg: `Photo removed from "${item.name}"` });
    } else {
      setNote({ type: "err", msg: "Failed to remove photo" });
    }
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
      if (!res.ok) {
        setNote({ type: "err", msg: data.error || "Failed to add item" });
        return;
      }
      let created: MenuItem = data;
      if (addFile) {
        const fd = new FormData();
        fd.append("file", addFile);
        const up = await fetch(`/api/admin/menu/${data.id}/image`, { method: "POST", body: fd });
        const ud = await up.json().catch(() => ({}));
        if (up.ok) created = { ...data, image: ud.image };
      }
      setItems((prev) => [...prev, created]);
      setDraft(emptyDraft);
      setAddFile(null);
      setAddKey((k) => k + 1);
      setNote({ type: "ok", msg: `Added "${created.name}"` });
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <h1 className="admin-h1">Menu</h1>
      <p className="admin-sub">
        Add, edit, reorder, or hide items. Changes save automatically as you edit.
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
            <label>Photo (optional)</label>
            <input
              key={addKey}
              type="file"
              accept="image/*"
              onChange={(e) => setAddFile(e.target.files?.[0] || null)}
            />
            <span className="hint-note">JPG, PNG or WebP, up to 5 MB.</span>
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
                    onBlur={() => save(item)}
                  />
                </div>
                <div className="admin-field" style={{ maxWidth: 80, flex: "0 0 80px" }}>
                  <label>Emoji</label>
                  <input
                    value={item.emoji}
                    onChange={(e) => patch(item.id, "emoji", e.target.value)}
                    onBlur={() => save(item)}
                  />
                </div>
                <div className="admin-field" style={{ maxWidth: 100, flex: "0 0 100px" }}>
                  <label>Order</label>
                  <input
                    type="number"
                    value={item.sortOrder}
                    onChange={(e) => patch(item.id, "sortOrder", Number(e.target.value))}
                    onBlur={() => save(item)}
                  />
                </div>
              </div>
              <div className="admin-field">
                <label>Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => patch(item.id, "description", e.target.value)}
                  onBlur={() => save(item)}
                />
              </div>
              <div className="admin-field">
                <label>Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(item, f);
                    e.target.value = "";
                  }}
                />
                <span className="hint-note">
                  {item.image ? "Choose a file to replace the current photo." : "No photo yet."}
                  {" "}JPG, PNG or WebP, up to 5 MB.
                </span>
                {item.image && (
                  <button
                    type="button"
                    className="admin-btn-sec"
                    style={{ marginTop: 8 }}
                    onClick={() => removeImage(item)}
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <div className="admin-actions">
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}
                >
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={(e) => {
                      const next = { ...item, active: e.target.checked };
                      patch(item.id, "active", e.target.checked);
                      save(next);
                    }}
                  />
                  Visible on site
                </label>
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
