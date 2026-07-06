"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { GalleryImage } from "@/app/lib/types";
import { uploadImageTo } from "./resizeImage";

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery", { cache: "no-store" });
      setItems(await res.json());
    } catch {
      setNote({ type: "err", msg: "Failed to load gallery" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadImageTo("/api/admin/gallery", file);
      if (r.ok) {
        setItems((prev) => [...prev, r.data]);
        setNote({ type: "ok", msg: "Photo added to the gallery." });
      } else {
        setNote({ type: "err", msg: r.error });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(item: GalleryImage) {
    if (!confirm("Remove this photo from the gallery?")) return;
    const res = await fetch(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNote({ type: "ok", msg: "Photo removed." });
    } else {
      setNote({ type: "err", msg: "Delete failed" });
    }
  }

  return (
    <div className="admin-card">
      <h2>Gallery (&ldquo;From our kitchen&rdquo;)</h2>
      <p className="order-meta" style={{ marginBottom: 12 }}>
        Photos shown in the home page gallery grid. Upload to add, or remove any photo.
      </p>
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      <div className="admin-field">
        <label>Add a photo</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={upload} disabled={uploading} />
        <span className="hint-note">JPG, PNG or WebP, up to 5 MB.{uploading ? " Uploading…" : ""}</span>
      </div>

      {loading ? (
        <p className="order-meta">Loading…</p>
      ) : (
        <div className="gallery-admin-grid">
          {items.map((g) => (
            <div className="gallery-admin-item" key={g.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.alt} />
              <button className="admin-btn-danger" onClick={() => remove(g)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
