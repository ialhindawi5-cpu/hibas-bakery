"use client";

import type { Settings } from "@/app/lib/types";
import { useSettingsForm } from "./SettingsProvider";

export type FieldDef = {
  key: keyof Settings;
  label: string;
  textarea?: boolean;
  list?: boolean;
  hint?: string;
};

// A titled group of settings inputs. All groups on a page share one form state
// (via SettingsProvider) and are saved together by the page's SettingsSaveBar.
export default function SettingsFields({
  fields,
  title,
}: {
  fields: FieldDef[];
  title?: string;
}) {
  const { settings, update } = useSettingsForm();

  if (!settings) return <p className="order-meta">Loading…</p>;

  return (
    <div className="admin-card">
      {title && <h2>{title}</h2>}
      {fields.map((f) => (
        <div className="admin-field" key={f.key}>
          <label>{f.label}</label>
          {f.list ? (
            <textarea
              value={
                Array.isArray(settings[f.key]) ? (settings[f.key] as string[]).join("\n") : ""
              }
              onChange={(e) =>
                update({
                  [f.key]: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                } as Partial<Settings>)
              }
            />
          ) : f.textarea ? (
            <textarea
              value={settings[f.key] as string}
              onChange={(e) => update({ [f.key]: e.target.value } as Partial<Settings>)}
            />
          ) : (
            <input
              value={settings[f.key] as string}
              onChange={(e) => update({ [f.key]: e.target.value } as Partial<Settings>)}
            />
          )}
          {f.hint && (
            <p className="order-meta" style={{ marginTop: 4 }}>
              {f.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
