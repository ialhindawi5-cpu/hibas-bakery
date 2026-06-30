"use client";

import SettingsFields from "../components/SettingsFields";

export default function AdminAbout() {
  return (
    <>
      <h1 className="admin-h1">About Page</h1>
      <p className="admin-sub">Edit the text shown on the About us page.</p>

      <SettingsFields
        title="About content"
        fields={[
          { key: "aboutTitle", label: "Heading" },
          { key: "aboutBody", label: "Story text", textarea: true },
        ]}
      />
    </>
  );
}
