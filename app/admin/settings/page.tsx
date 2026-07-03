"use client";

import { useState } from "react";
import SettingsFields from "../components/SettingsFields";
import HistoryManager from "../components/HistoryManager";
import LogoEditor from "../components/LogoEditor";
import UsersManager from "../components/UsersManager";

type Tab = "branding" | "users" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "branding", label: "Website Branding" },
  { key: "users", label: "Admin Users" },
  { key: "history", label: "Version History" },
];

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>("branding");

  return (
    <>
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-sub">Manage your website branding, admin users, and version history.</p>

      <div className="settings-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "branding" && (
        <>
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
              {
                key: "phoneLink",
                label: "Phone (dial format)",
                hint: "Digits only, e.g. +16138663231",
              },
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
        </>
      )}

      {tab === "users" && <UsersManager />}

      {tab === "history" && <HistoryManager />}
    </>
  );
}
