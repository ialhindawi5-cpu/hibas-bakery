"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { uploadImageTo } from "./resizeImage";

export default function AboutImageEditor() {
  const [src, setSrc] = useState("/images/sourdough.jpg");
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const s = await fetch("/api/admin/settings", { cache: "no-store" }).then((r) => r.json());
      setSrc(s.aboutImage || "/images/sourdough.jpg");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = await uploadImageTo("/api/admin/about-image", file);
    if (r.ok) {
      setSrc(String(r.data.image));
      setNote({ type: "ok", msg: "Saved to draft. Publish to make it live." });
      window.dispatchEvent(new Event("bk:draft-changed"));
    } else {
      setNote({ type: "err", msg: r.error });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function reset() {
    if (!confirm("Reset the About photo to the default?")) return;
    const res = await fetch("/api/admin/about-image", { method: "DELETE" });
    if (res.ok) {
      await load();
      setNote({ type: "ok", msg: "Reset to default (draft). Publish to make it live." });
      window.dispatchEvent(new Event("bk:draft-changed"));
    }
  }

  return (
    <div className="admin-card">
      <h2>About photo</h2>
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="About"
          style={{
            width: 150,
            height: 110,
            objectFit: "cover",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        />
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={upload} />
          <p className="order-meta" style={{ marginTop: 8 }}>
            JPG, PNG or WebP, up to 5 MB.
          </p>
          <button type="button" className="admin-btn-danger" style={{ marginTop: 6 }} onClick={reset}>
            Reset to default
          </button>
        </div>
      </div>
    </div>
  );
}
