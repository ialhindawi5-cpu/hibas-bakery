"use client";

import LogoEditor from "../components/LogoEditor";
import SettingsFields from "../components/SettingsFields";
import SettingsProvider from "../components/SettingsProvider";
import SettingsSaveBar from "../components/SettingsSaveBar";

export default function AdminBranding() {
  return (
    <SettingsProvider>
      <h1 className="admin-h1">Logo &amp; Name</h1>
      <p className="admin-sub">
        Your bakery&apos;s logo and name — shown in the header, footer, and browser tab.
      </p>

      <LogoEditor />

      <SettingsFields
        title="Bakery name"
        fields={[{ key: "siteName", label: "Name (shown in header & footer)" }]}
      />

      <SettingsSaveBar />
    </SettingsProvider>
  );
}
