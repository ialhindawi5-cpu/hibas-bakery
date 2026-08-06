"use client";

import { useState } from "react";
import SeoIndexing from "../components/SeoIndexing";
import SeoPagesEditor from "../components/SeoPagesEditor";
import SeoSharing from "../components/SeoSharing";
import SeoBusinessEditor from "../components/SeoBusinessEditor";

type Tab = "google" | "pages" | "sharing" | "business";

const TABS: { key: Tab; label: string }[] = [
  { key: "google", label: "Google & indexing" },
  { key: "pages", label: "Page titles & descriptions" },
  { key: "sharing", label: "Sharing preview" },
  { key: "business", label: "Business details" },
];

export default function AdminSeo() {
  const [tab, setTab] = useState<Tab>("google");

  return (
    <>
      <h1 className="admin-h1">SEO &amp; Google</h1>
      <p className="admin-sub">
        Control how your website appears in Google, and get it listed. Changes are saved
        as a draft — click <b>Publish to website</b> to make them live.
      </p>

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

      {tab === "google" && <SeoIndexing />}
      {tab === "pages" && <SeoPagesEditor />}
      {tab === "sharing" && <SeoSharing />}
      {tab === "business" && <SeoBusinessEditor />}
    </>
  );
}
