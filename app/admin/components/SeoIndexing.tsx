"use client";

import { useCallback, useEffect, useState } from "react";
import type { Seo } from "@/app/lib/types";
import { useSettingsForm } from "./SettingsProvider";

type Check = { id: string; label: string; status: "ok" | "warn" | "error"; detail: string };
type Audit = {
  siteUrl: string;
  score: number;
  checks: Check[];
  sitemap: string;
  robots: string;
};

const ICON: Record<Check["status"], string> = { ok: "✓", warn: "!", error: "×" };

export default function SeoIndexing() {
  const { settings, update } = useSettingsForm();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/seo/audit", { cache: "no-store" });
      if (r.ok) setAudit(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!settings) return <p className="order-meta">Loading…</p>;

  const seo = settings.seo;
  const patch = (p: Partial<Seo>) => update({ seo: { ...seo, ...p } });

  // The audit reports the live site's address; before it loads, fall back to
  // the browser's own origin so the help links are never dead.
  const site = audit?.siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const host = site.replace(/^https?:\/\//, "");

  return (
    <>
      <div className="admin-card">
        <h2>Show my website on Google</h2>
        <label className="seo-switch">
          <input
            type="checkbox"
            checked={seo.indexable}
            onChange={(e) => patch({ indexable: e.target.checked })}
          />
          <span>
            <b>Let search engines find and list my website</b>
            <em>
              Turn this off only while the site is unfinished. Off means robots.txt asks
              Google, Bing and everyone else to stay out — the site stays reachable by
              anyone with the link, but it disappears from search results.
            </em>
          </span>
        </label>

        <label className="seo-switch">
          <input
            type="checkbox"
            checked={seo.structuredData}
            onChange={(e) => patch({ structuredData: e.target.checked })}
          />
          <span>
            <b>Publish bakery details for Google rich results</b>
            <em>
              Sends your address, phone, opening hours and menu prices to Google in the
              format it reads, so the listing can show them. Leave this on.
            </em>
          </span>
        </label>

        {!seo.indexable && (
          <div className="admin-note warn">
            Your website is currently hidden from Google. Nothing below will get it
            listed until you turn the switch above back on and publish.
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>Google Search Console</h2>
        <p className="order-meta" style={{ marginTop: -6 }}>
          Search Console is Google&apos;s free dashboard for your website. It proves the
          site is yours, lets you submit it for indexing, and shows what people searched
          for to find you.
        </p>

        <div className="admin-field">
          <label>Google verification code</label>
          <input
            value={seo.googleVerification}
            placeholder="e.g. Ab1cD2eFgH3iJkLmN4oPqR5sTuV6wXyZ"
            onChange={(e) => patch({ googleVerification: e.target.value.trim() })}
          />
          <p className="order-meta" style={{ marginTop: 4 }}>
            In Search Console choose the <b>HTML tag</b> verification method and paste
            only the <code>content=&quot;…&quot;</code> value here.
          </p>
        </div>

        <div className="admin-field">
          <label>Bing verification code (optional)</label>
          <input
            value={seo.bingVerification}
            placeholder="Bing Webmaster Tools meta value"
            onChange={(e) => patch({ bingVerification: e.target.value.trim() })}
          />
        </div>

        <ol className="seo-steps">
          <li>
            Open{" "}
            <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
              Google Search Console
            </a>{" "}
            and sign in with your Google account.
          </li>
          <li>
            Click <b>Add property</b> → <b>URL prefix</b> and enter{" "}
            <code>{site || "your website address"}</code>.
          </li>
          <li>
            Pick <b>HTML tag</b> verification, copy the code out of the tag, paste it in
            the box above, then <b>Save changes</b> and <b>Publish to website</b>.
          </li>
          <li>
            Go back to Search Console and press <b>Verify</b>.
          </li>
          <li>
            Open <b>Sitemaps</b>, enter <code>sitemap.xml</code> and submit it. That is
            the list of your pages —{" "}
            {site && (
              <a href={`${site}/sitemap.xml`} target="_blank" rel="noreferrer">
                view it
              </a>
            )}
            .
          </li>
          <li>
            Use <b>URL Inspection</b> on your home page and click <b>Request indexing</b>{" "}
            to jump the queue. Repeat for the menu and order pages.
          </li>
          <li>
            Google usually takes a few days to a couple of weeks for a new site. Check
            progress any time with{" "}
            {host && (
              <a
                href={`https://www.google.com/search?q=site:${encodeURIComponent(host)}`}
                target="_blank"
                rel="noreferrer"
              >
                a site: search
              </a>
            )}
            .
          </li>
        </ol>

        <div className="admin-note">
          <b>Also worth doing:</b> create a free{" "}
          <a href="https://business.google.com/" target="_blank" rel="noreferrer">
            Google Business Profile
          </a>
          . For a local bakery it is usually a bigger source of customers than the
          website listing itself — it puts you on Google Maps and in the &quot;bakery
          near me&quot; results.
        </div>
      </div>

      <div className="admin-card">
        <div className="seo-audit-head">
          <h2 style={{ margin: 0 }}>SEO check</h2>
          <button type="button" className="admin-btn-sec" onClick={load} disabled={loading}>
            {loading ? "Checking…" : "Re-check"}
          </button>
        </div>
        <p className="order-meta">
          Checks the <b>published</b> website — what Google sees right now.
        </p>

        {audit && (
          <>
            <div className={`seo-score ${audit.score >= 90 ? "good" : audit.score >= 60 ? "mid" : "bad"}`}>
              <strong>{audit.score}%</strong>
              <span>
                {audit.checks.filter((c) => c.status === "ok").length} of{" "}
                {audit.checks.length} checks passing
              </span>
            </div>

            <ul className="seo-checks">
              {audit.checks.map((c) => (
                <li key={c.id} className={c.status}>
                  <span className="seo-check-icon" aria-hidden>
                    {ICON[c.status]}
                  </span>
                  <span>
                    <b>{c.label}</b>
                    <em>{c.detail}</em>
                  </span>
                </li>
              ))}
            </ul>

            <div className="seo-links">
              <a href={audit.robots} target="_blank" rel="noreferrer">
                View robots.txt
              </a>
              <a href={audit.sitemap} target="_blank" rel="noreferrer">
                View sitemap.xml
              </a>
              <a
                href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(audit.siteUrl)}`}
                target="_blank"
                rel="noreferrer"
              >
                Test rich results
              </a>
              <a
                href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(audit.siteUrl)}`}
                target="_blank"
                rel="noreferrer"
              >
                Test speed
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
