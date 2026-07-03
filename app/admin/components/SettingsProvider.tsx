"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { Settings } from "@/app/lib/types";

type Note = { type: "ok" | "err"; msg: string } | null;

// A page (e.g. Prices) can register its own save so the top-bar "Save changes"
// button saves it too — keeping save + publish in one place.
type ExtraSaver = () => Promise<boolean>;

type Ctx = {
  settings: Settings | null;
  update: (patch: Partial<Settings>) => void;
  save: () => Promise<void>;
  saving: boolean;
  dirty: boolean;
  note: Note;
  registerExtraSaver: (fn: ExtraSaver | null, dirty: boolean) => void;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function useSettingsForm(): Ctx {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("useSettingsForm must be used within <SettingsProvider>");
  return c;
}

export default function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState<string>(""); // JSON snapshot of last-saved settings
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Note>(null);

  // Optional page-provided saver (kept in a ref so keystrokes don't re-render).
  const extraRef = useRef<ExtraSaver | null>(null);
  const [extraDirty, setExtraDirty] = useState(false);

  const registerExtraSaver = useCallback((fn: ExtraSaver | null, dirty: boolean) => {
    extraRef.current = fn;
    setExtraDirty(fn ? dirty : false); // no-op re-render when value is unchanged
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    const data = (await res.json()) as Settings;
    setSettings(data);
    setSaved(JSON.stringify(data));
    setNote(null);
  }, []);

  useEffect(() => {
    load();
    const onRevert = () => load();
    window.addEventListener("bk:draft-reverted", onRevert);
    return () => window.removeEventListener("bk:draft-reverted", onRevert);
  }, [load]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    setNote(null);
  }, []);

  const settingsDirty = settings ? JSON.stringify(settings) !== saved : false;

  const saveSettings = useCallback(async (): Promise<boolean> => {
    if (!settings) return true;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved(JSON.stringify(settings));
      window.dispatchEvent(new Event("bk:draft-changed"));
    }
    return res.ok;
  }, [settings]);

  const save = useCallback(async () => {
    setSaving(true);
    setNote(null);
    try {
      let ok = true;
      let didSettings = false;
      let didExtra = false;
      if (settingsDirty) {
        didSettings = true;
        if (!(await saveSettings())) ok = false;
      }
      if (extraRef.current && extraDirty) {
        didExtra = true;
        if (!(await extraRef.current())) ok = false;
        if (ok) setExtraDirty(false);
      }
      if (!ok) {
        setNote({ type: "err", msg: "Save failed" });
      } else if (didSettings && !didExtra) {
        setNote({ type: "ok", msg: "Saved to draft. Click “Publish to website” to go live." });
      } else {
        setNote({ type: "ok", msg: "Saved." });
      }
    } finally {
      setSaving(false);
    }
  }, [settingsDirty, saveSettings, extraDirty]);

  const dirty = settingsDirty || extraDirty;

  return (
    <SettingsCtx.Provider
      value={{ settings, update, save, saving, dirty, note, registerExtraSaver }}
    >
      {children}
    </SettingsCtx.Provider>
  );
}
