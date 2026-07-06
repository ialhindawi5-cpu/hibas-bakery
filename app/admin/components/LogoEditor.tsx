"use client";

import { useRef, useState } from "react";
import { resizeImage } from "./resizeImage";

export default function LogoEditor() {
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const [v, setV] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", await resizeImage(file));
    const res = await fetch("/api/admin/logo", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setV((x) => x + 1);
      setNote({ type: "ok", msg: "Logo updated." });
    } else {
      setNote({ type: "err", msg: data.error || "Logo upload failed" });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removeLogo() {
    if (!confirm("Remove the logo and use the default emblem?")) return;
    const res = await fetch("/api/admin/logo", { method: "DELETE" });
    if (res.ok) {
      setV((x) => x + 1);
      setNote({ type: "ok", msg: "Logo removed." });
    }
  }

  return (
    <div className="admin-card">
      <h2>Logo</h2>
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="logo-preview"
          src={`/api/logo?v=${v}`}
          alt="Current logo"
          onError={(ev) => {
            (ev.target as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={uploadLogo}
          />
          <p className="order-meta" style={{ marginTop: 8 }}>
            PNG, JPG, WebP or SVG, up to 3&nbsp;MB. If no logo is set, a default emblem is shown.
          </p>
          <button
            type="button"
            className="admin-btn-danger"
            style={{ marginTop: 6 }}
            onClick={removeLogo}
          >
            Remove logo
          </button>
        </div>
      </div>
    </div>
  );
}
