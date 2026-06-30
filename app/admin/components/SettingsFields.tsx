"use client";

import { useEffect, useState, useCallback } from "react";
import type { Settings } from "@/app/lib/types";

export type FieldDef = {
  key: keyof Settings;
  label: string;
  textarea?: boolean;
  hint?: string;
};

export default function SettingsFields({
  fields,
  title,
}: {
  fields: FieldDef[];
  title?: string;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [note, setNote] = useState<{ type: string; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

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
      // Send only this section's fields; the server merges with the rest.
      const patch: Record<string, unknown> = {};
      for (const f of fields) patch[f.key] = settings[f.key];
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
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

  if (!settings) return <p className="order-meta">Loading…</p>;

  return (
    <form onSubmit={save} className="admin-card">
      {title && <h2>{title}</h2>}
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}
      {fields.map((f) => (
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
  );
}
