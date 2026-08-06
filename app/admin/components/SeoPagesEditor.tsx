"use client";

import { useEffect, useState } from "react";
import {
  DESC_MAX,
  DESC_MIN,
  SEO_PAGES,
  TITLE_MAX,
  TITLE_MIN,
  resolvePageSeo,
} from "@/app/lib/seo";
import type { Seo, SeoPage, SeoPageKey } from "@/app/lib/types";
import { useSettingsForm } from "./SettingsProvider";

function counterClass(len: number, min: number, max: number): string {
  if (len > max) return "over";
  if (len < min) return "under";
  return "good";
}

export default function SeoPagesEditor() {
  const { settings, update } = useSettingsForm();
  const [origin, setOrigin] = useState("");

  // The public address is server-side config; the browser's own origin is the
  // closest stand-in for the preview breadcrumb.
  useEffect(() => setOrigin(window.location.origin.replace(/^https?:\/\//, "")), []);

  if (!settings) return <p className="order-meta">Loading…</p>;

  const seo = settings.seo;
  const patchPage = (key: SeoPageKey, p: Partial<SeoPage>) => {
    const next: Seo = {
      ...seo,
      pages: { ...seo.pages, [key]: { ...seo.pages[key], ...p } },
    };
    update({ seo: next });
  };

  return (
    <>
      <div className="admin-card">
        <h2>What Google shows for each page</h2>
        <p className="order-meta" style={{ marginTop: -6 }}>
          The <b>title</b> is the blue clickable line in Google&apos;s results; the{" "}
          <b>description</b> is the grey text underneath. Write them for a customer, not
          for a search engine — and put the words people actually type (cookies, Arab
          desserts, sourdough, your city) near the front. Leave a box empty to use the
          built-in wording.
        </p>
        <p className="order-meta">
          You can use <code>{"{siteName}"}</code>, <code>{"{pickup}"}</code>,{" "}
          <code>{"{phone}"}</code>, <code>{"{hours}"}</code> and <code>{"{city}"}</code> —
          they are filled in automatically, so the text keeps up when those settings
          change.
        </p>
      </div>

      {SEO_PAGES.map(({ key, label, path }) => {
        const page = seo.pages[key];
        const resolved = resolvePageSeo(settings, key);
        const titleLen = resolved.title.length;
        const descLen = resolved.description.length;

        return (
          <div className="admin-card" key={key}>
            <h2>
              {label} <span className="seo-path">{path}</span>
            </h2>

            <div className="seo-serp">
              <div className="seo-serp-url">
                {origin || "your-website.com"}
                <span>{path === "/" ? "" : path.replace(/\//g, " › ")}</span>
              </div>
              <div className="seo-serp-title">
                {resolved.title.slice(0, TITLE_MAX)}
                {titleLen > TITLE_MAX && "…"}
              </div>
              <div className="seo-serp-desc">
                {resolved.description.slice(0, DESC_MAX)}
                {descLen > DESC_MAX && "…"}
              </div>
              {resolved.noindex && (
                <div className="seo-serp-hidden">
                  {seo.indexable
                    ? "Hidden — this page won't appear in Google."
                    : "Hidden — the whole website is set to stay out of Google."}
                </div>
              )}
            </div>

            <div className="admin-field">
              <label>
                Title
                <span className={`seo-count ${counterClass(titleLen, TITLE_MIN, TITLE_MAX)}`}>
                  {titleLen}/{TITLE_MAX}
                </span>
              </label>
              <input
                value={page.title}
                onChange={(e) => patchPage(key, { title: e.target.value })}
              />
            </div>

            <div className="admin-field">
              <label>
                Description
                <span className={`seo-count ${counterClass(descLen, DESC_MIN, DESC_MAX)}`}>
                  {descLen}/{DESC_MAX}
                </span>
              </label>
              <textarea
                value={page.description}
                onChange={(e) => patchPage(key, { description: e.target.value })}
              />
            </div>

            <label className="seo-switch">
              <input
                type="checkbox"
                checked={page.noindex}
                onChange={(e) => patchPage(key, { noindex: e.target.checked })}
              />
              <span>
                <b>Hide this page from Google</b>
                <em>
                  The page stays on the website and anyone with the link can still open
                  it — it just won&apos;t be listed in search results or the sitemap.
                </em>
              </span>
            </label>
          </div>
        );
      })}
    </>
  );
}
