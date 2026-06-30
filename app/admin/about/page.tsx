"use client";

import SettingsFields from "../components/SettingsFields";
import AboutImageEditor from "../components/AboutImageEditor";

export default function AdminAbout() {
  return (
    <>
      <h1 className="admin-h1">About Page</h1>
      <p className="admin-sub">Edit everything shown on the About us page — text, lists, and photo.</p>

      <SettingsFields
        title="Page heading"
        fields={[
          { key: "aboutEyebrow", label: "Small label (eyebrow)" },
          { key: "aboutHeadline", label: "Headline" },
          { key: "aboutIntro", label: "Intro line" },
        ]}
      />

      <AboutImageEditor />

      <SettingsFields
        title="Story section"
        fields={[
          { key: "aboutSectionEyebrow", label: "Small label (eyebrow)" },
          { key: "aboutHeading", label: "Heading" },
          { key: "aboutBody", label: "Paragraph 1", textarea: true },
          { key: "aboutBody2", label: "Paragraph 2", textarea: true },
          {
            key: "aboutFeatures",
            label: "Checklist (one per line)",
            list: true,
            hint: "The ticked points beside the photo.",
          },
        ]}
      />

      <SettingsFields
        title="“Our promise” section"
        fields={[
          { key: "promiseEyebrow", label: "Small label (eyebrow)" },
          { key: "promiseHeading", label: "Heading" },
          {
            key: "aboutValues",
            label: "Cards (one per line, format: icon | title | text)",
            list: true,
            hint: "Example:  💝 | Made with love | Every order is baked by hand.",
          },
        ]}
      />

      <SettingsFields
        title="Bottom call-to-action"
        fields={[
          { key: "aboutCtaHeading", label: "Heading" },
          { key: "aboutCtaText", label: "Text", textarea: true },
        ]}
      />
    </>
  );
}
