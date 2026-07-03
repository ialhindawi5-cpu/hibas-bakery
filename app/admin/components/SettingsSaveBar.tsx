"use client";

import { useSettingsForm } from "./SettingsProvider";

// One "Save changes" button that persists every section on the page to the
// draft. Publishing to the live site is still done from the top Publish bar.
export default function SettingsSaveBar() {
  const { save, saving, dirty, note } = useSettingsForm();
  return (
    <div className="settings-savebar">
      {note && <div className={`admin-note ${note.type}`}>{note.msg}</div>}
      {!note && dirty && (
        <div className="settings-savebar-hint">You have unsaved changes.</div>
      )}
      <button className="admin-btn" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
