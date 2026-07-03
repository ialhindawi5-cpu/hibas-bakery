"use client";

import SettingsFields from "../components/SettingsFields";
import HistoryManager from "../components/HistoryManager";
import LogoEditor from "../components/LogoEditor";
import UsersManager from "../components/UsersManager";

export default function AdminSettings() {
  return (
    <>
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-sub">
        Your bakery name &amp; logo, contact details, pickup, admin users, and version history.
      </p>

      <SettingsFields
        title="Bakery name"
        fields={[{ key: "siteName", label: "Name (shown in header & footer)" }]}
      />

      <LogoEditor />

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

      <UsersManager />

      <HistoryManager />
    </>
  );
}
