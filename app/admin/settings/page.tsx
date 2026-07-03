"use client";

import SettingsFields from "../components/SettingsFields";
import SettingsProvider from "../components/SettingsProvider";
import SettingsSaveBar from "../components/SettingsSaveBar";
import HistoryManager from "../components/HistoryManager";

export default function AdminSettings() {
  return (
    <SettingsProvider>
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-sub">Contact details, pickup, and where orders are emailed.</p>

      <SettingsFields
        title="Contact & pickup"
        fields={[
          {
            key: "orderEmail",
            label: "Order notifications email",
            hint: "Where new orders are emailed.",
          },
          { key: "contactEmail", label: "Public contact email" },
          { key: "phoneDisplay", label: "Phone (shown)" },
          { key: "phoneLink", label: "Phone (dial format)", hint: "Digits only, e.g. +16138663231" },
          { key: "instagram", label: "Instagram URL" },
          { key: "instagramHandle", label: "Instagram handle" },
          { key: "pickup", label: "Pickup address" },
          {
            key: "mapQuery",
            label: "Map location",
            hint: "Coordinates (e.g. 45.2888539,-75.9247394) or an address — shown as a map on the Contact page.",
          },
          { key: "hours", label: "Working hours", hint: "e.g. Monday – Saturday · 11am – 7pm" },
        ]}
      />

      <SettingsSaveBar />

      <HistoryManager />
    </SettingsProvider>
  );
}
