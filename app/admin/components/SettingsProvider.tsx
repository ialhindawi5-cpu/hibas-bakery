"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Settings } from "@/app/lib/types";

type Note = { type: "ok" | "err"; msg: string } | null;

type Ctx = {
  settings: Settings | null;
  update: (patch: Partial<Settings>) => void;
  save: () => Promise<void>;
  saving: boolean;
  dirty: boolean;
  note: Note;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function useSettingsForm(): Ctx {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("useSettingsForm must be used within <SettingsProvider>");
  return c;
}

// Loads the draft settings once and shares them with every SettingsFields
// section on the page, so a single "Save changes" button persists them all.
export default function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState<string>(""); // JSON snapshot of last-saved state
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    const data = (await res.json()) as Settings;
    setSettings(data);
    setSaved(JSON.stringify(data));
    setNote(null);
  }, []);

  useEffect(() => {
    load();
    // Reload if the draft is discarded from the Publish bar.
    const onRevert = () => load();
    window.addEventListener("bk:draft-reverted", onRevert);
    return () => window.removeEventListener("bk:draft-reverted", onRevert);
  }, [load]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    setNote(null);
  }, []);

  const save = useCallback(async () => {
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
      if (res.ok) {
        setSaved(JSON.stringify(settings));
        setNote({ type: "ok", msg: "Saved to draft. Click “Publish to website” to go live." });
        window.dispatchEvent(new Event("bk:draft-changed"));
      } else {
        setNote({ type: "err", msg: data.error || "Save failed" });
      }
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const dirty = settings ? JSON.stringify(settings) !== saved : false;

  return (
    <SettingsCtx.Provider value={{ settings, update, save, saving, dirty, note }}>
      {children}
    </SettingsCtx.Provider>
  );
}
