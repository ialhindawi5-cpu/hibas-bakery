"use client";

import SettingsFields from "../components/SettingsFields";
import SettingsProvider from "../components/SettingsProvider";
import SettingsSaveBar from "../components/SettingsSaveBar";
import FeaturedManager from "../components/FeaturedManager";
import GalleryManager from "../components/GalleryManager";

export default function AdminHome() {
  return (
    <SettingsProvider>
      <h1 className="admin-h1">Home Page</h1>
      <p className="admin-sub">
        Everything shown on the home page — the hero text, the favourites carousel, the gallery,
        and the footer.
      </p>

      <SettingsFields
        title="Hero (top of the page)"
        fields={[
          { key: "heroTitle", label: "Headline" },
          { key: "heroSubtitle", label: "Subtitle", textarea: true },
        ]}
      />

      <SettingsFields
        title="Announcement bar (scrolling)"
        fields={[
          {
            key: "announcements",
            label: "Announcements (one per line)",
            list: true,
            hint: "Scrolls across the home page under the hero. e.g. We're closed on Sundays",
          },
        ]}
      />

      <FeaturedManager />

      <GalleryManager />

      <SettingsFields
        title="Footer"
        fields={[
          { key: "footerText", label: "Footer description", textarea: true },
        ]}
      />

      <SettingsSaveBar />
    </SettingsProvider>
  );
}
