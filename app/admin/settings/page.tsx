"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Settings } from "@/app/lib/types";

const FIELDS: { key: keyof Settings; label: string; textarea?: boolean; hint?: string }[] = [
  { key: "siteName", label: "Bakery name" },
  { key: "orderEmail", label: "Order notifications email", hint: "Where new orders are emailed." },
  { key: "contactEmail", label: "Public contact email" },
  { key: "phoneDisplay", label: "Phone (shown)" },
  { key: "phoneLink", label: "Phone (dial format)", hint: "Digits only, e.g. +16138663231" },
  { key: "instagram", label: "Instagram URL" },
  { key: "instagramHandle", label: "Instagram handle" },
  { key: "pickup", label: "Pickup address" },
  { key: "heroTitle", label: "Homepage headline" },
  { key: "heroSubtitle", label: "Homepage subtitle", textarea: true },
  { key: "aboutTitle", label: "About heading" },
  { key: "aboutBody", label: "About text", textarea: true },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    setSettings(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      setNote(
        res.ok
          ? { type: "ok", msg: "Saved. Changes are live on the website." }
          : { type: "err", msg: data.error || "Save failed" }
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/logo", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setLogoVersion((v) => v + 1);
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
      setLogoVersion((v) => v + 1);
      setNote({ type: "ok", msg: "Logo removed." });
    }
  }

  if (!settings) return <p className="order-meta">Loading…</p>;

  return (
    <>
      <h1 className="admin-h1">Settings &amp; Logo</h1>
      <p className="admin-sub">Edit your bakery name, contact details, homepage text, and logo.</p>

      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}

      {/* Logo */}
      <div className="admin-card">
        <h2>Logo</h2>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="logo-preview"
            src={`/api/logo?v=${logoVersion}`}
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

      {/* Settings form */}
      <form onSubmit={save} className="admin-card">
        <h2>Content &amp; details</h2>
        {FIELDS.map((f) => (
          <div className="admin-field" key={f.key}>
            <label>{f.label}</label>
            {f.textarea ? (
              <textarea
                value={settings[f.key]}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              />
            ) : (
              <input
                value={settings[f.key]}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              />
            )}
            {f.hint && (
              <p className="order-meta" style={{ marginTop: 4 }}>
                {f.hint}
              </p>
            )}
          </div>
        ))}
        <button className="admin-btn" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </>
  );
}
