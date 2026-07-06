"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { MenuItem } from "@/app/lib/types";
import { useSettingsForm } from "./SettingsProvider";
import { resizeImage } from "./resizeImage";

export default function FeaturedManager() {
  const { registerExtraSaver } = useSettingsForm();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const savedRef = useRef<Record<number, string>>({});

  // Add-new-favourite form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu", { cache: "no-store" });
      const data = (await res.json()) as MenuItem[];
      setItems(data);
      savedRef.current = Object.fromEntries(data.map((i) => [i.id, JSON.stringify(i)]));
    } catch {
      setNote({ type: "err", msg: "Failed to load items" });
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

  // Save every edited item. Returns true if all succeeded.
  const doSave = useCallback(async (): Promise<boolean> => {
    let ok = true;
    for (const item of items) {
      if (savedRef.current[item.id] === JSON.stringify(item)) continue;
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) savedRef.current[item.id] = JSON.stringify(item);
      else ok = false;
    }
    return ok;
  }, [items]);

  const dirty = items.some((i) => savedRef.current[i.id] !== JSON.stringify(i));

  useEffect(() => {
    registerExtraSaver("carousel", doSave, dirty);
  }, [registerExtraSaver, doSave, dirty]);
  useEffect(() => {
    return () => registerExtraSaver("carousel", null, false);
  }, [registerExtraSaver]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, featured: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNote({ type: "err", msg: data.error || "Failed to add item" });
        return;
      }
      let created: MenuItem = data;
      if (file) {
        const fd = new FormData();
        fd.append("file", await resizeImage(file));
        const up = await fetch(`/api/admin/menu/${data.id}/image`, { method: "POST", body: fd });
        const ud = await up.json().catch(() => ({}));
        if (up.ok) created = { ...data, image: ud.image };
      }
      setItems((prev) => [...prev, created]);
      savedRef.current[created.id] = JSON.stringify(created);
      setName("");
      setDescription("");
      setFile(null);
      setFileKey((k) => k + 1);
      setNote({ type: "ok", msg: `Added "${created.name}" to the carousel.` });
    } finally {
      setAdding(false);
    }
  }

  async function uploadImage(item: MenuItem, f: File) {
    setNote({ type: "ok", msg: `Uploading photo for "${item.name}"…` });
    const fd = new FormData();
    fd.append("file", await resizeImage(f));
    const res = await fetch(`/api/admin/menu/${item.id}/image`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      patch(item.id, "image", data.image);
      savedRef.current[item.id] = JSON.stringify({ ...item, image: data.image });
      setNote({ type: "ok", msg: `Photo updated for "${item.name}"` });
    } else {
      setNote({ type: "err", msg: data.error || "Upload failed" });
    }
  }

  async function removeItem(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"? This removes it from the carousel and the menu.`)) return;
    const res = await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      delete savedRef.current[item.id];
      setNote({ type: "ok", msg: `Deleted "${item.name}"` });
    } else {
      setNote({ type: "err", msg: "Delete failed" });
    }
  }

  const count = items.filter((i) => i.featured).length;

  return (
    <div className="admin-card">
      <h2>Our Favourites (carousel)</h2>
      <p className="order-meta" style={{ marginBottom: 12 }}>
        Pick which items scroll in the auto-playing &ldquo;Freshly baked treats&rdquo; carousel on
        the home page. {count} selected. Edit, then click <strong>Save changes</strong> at the top.
      </p>
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      {/* Add a new favourite */}
      <form
        onSubmit={add}
        style={{ borderBottom: "1px solid var(--border)", paddingBottom: 18, marginBottom: 18 }}
      >
        <div className="admin-field">
          <label>Add a new favourite — name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pistachio Baklava"
          />
        </div>
        <div className="admin-field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Photo (optional)</label>
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <span className="hint-note">
            JPG, PNG or WebP, up to 5 MB. It will also be added to your Menu.
          </span>
        </div>
        <button className="admin-btn" disabled={adding}>
          {adding ? "Adding…" : "Add to carousel"}
        </button>
      </form>

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
              <div className="admin-field">
                <label>Name</label>
                <input value={item.name} onChange={(e) => patch(item.id, "name", e.target.value)} />
              </div>
              <div className="admin-field">
                <label>Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => patch(item.id, "description", e.target.value)}
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
                </span>
              </div>
              <div className="admin-actions">
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}
                >
                  <input
                    type="checkbox"
                    checked={item.featured}
                    onChange={(e) => patch(item.id, "featured", e.target.checked)}
                  />
                  In carousel
                </label>
                <button className="admin-btn-danger" onClick={() => removeItem(item)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
