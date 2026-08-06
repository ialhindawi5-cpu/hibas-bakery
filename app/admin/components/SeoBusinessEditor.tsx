"use client";

import { businessJsonLd, deriveOpeningHours } from "@/app/lib/seo";
import type { Seo, SeoBusiness } from "@/app/lib/types";
import { useSettingsForm } from "./SettingsProvider";

const TYPES = [
  { value: "Bakery", label: "Bakery" },
  { value: "FoodEstablishment", label: "Food business (general)" },
  { value: "CafeOrCoffeeShop", label: "Café" },
  { value: "Restaurant", label: "Restaurant" },
  { value: "Store", label: "Shop" },
];

export default function SeoBusinessEditor() {
  const { settings, update } = useSettingsForm();
  if (!settings) return <p className="order-meta">Loading…</p>;

  const seo = settings.seo;
  const b = seo.business;
  const patch = (p: Partial<SeoBusiness>) => {
    const next: Seo = { ...seo, business: { ...b, ...p } };
    update({ seo: next });
  };
  const patchList = (key: "servesCuisine" | "openingHours" | "sameAs", value: string) => {
    const list = value.split("\n").map((s) => s.trim()).filter(Boolean);
    patch(key === "servesCuisine" ? { servesCuisine: list } : key === "openingHours" ? { openingHours: list } : { sameAs: list });
  };

  const suggested = deriveOpeningHours(settings.hours);
  const preview = businessJsonLd(settings, "https://your-website.com", null);

  return (
    <>
      <div className="admin-card">
        <h2>Business details for local search</h2>
        <p className="order-meta" style={{ marginTop: -6 }}>
          These are sent to Google in the background so it can show your address, hours
          and price range next to your listing, and put you in local &quot;bakery near
          me&quot; results. Nothing here changes what visitors see on the website.
        </p>

        <div className="admin-field">
          <label>Kind of business</label>
          <select value={b.type} onChange={(e) => patch({ type: e.target.value })}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-row">
          <div className="admin-field">
            <label>Street address</label>
            <input
              value={b.streetAddress}
              placeholder={settings.pickup}
              onChange={(e) => patch({ streetAddress: e.target.value })}
            />
            <p className="order-meta" style={{ marginTop: 4 }}>
              Leave empty to use the pickup address from Settings.
            </p>
          </div>
          <div className="admin-field">
            <label>City</label>
            <input
              value={b.city}
              placeholder="e.g. Ottawa"
              onChange={(e) => patch({ city: e.target.value })}
            />
          </div>
        </div>

        <div className="admin-row">
          <div className="admin-field">
            <label>Province / state</label>
            <input
              value={b.region}
              placeholder="e.g. ON"
              onChange={(e) => patch({ region: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Postal code</label>
            <input value={b.postalCode} onChange={(e) => patch({ postalCode: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Country code</label>
            <input
              value={b.country}
              placeholder="CA"
              onChange={(e) => patch({ country: e.target.value.toUpperCase().slice(0, 2) })}
            />
          </div>
        </div>

        <div className="admin-row">
          <div className="admin-field">
            <label>Latitude</label>
            <input
              value={b.latitude}
              placeholder="from the map location in Settings"
              onChange={(e) => patch({ latitude: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Longitude</label>
            <input
              value={b.longitude}
              placeholder="from the map location in Settings"
              onChange={(e) => patch({ longitude: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Price range</label>
            <input
              value={b.priceRange}
              placeholder="$$"
              onChange={(e) => patch({ priceRange: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Opening hours</h2>
        <div className="admin-field">
          <label>One line per opening block</label>
          <textarea
            value={b.openingHours.join("\n")}
            placeholder={suggested.join("\n") || "Mo-Sa 11:00-19:00"}
            onChange={(e) => patchList("openingHours", e.target.value)}
          />
          <p className="order-meta" style={{ marginTop: 4 }}>
            Google&apos;s format: two-letter days and 24-hour times, e.g.{" "}
            <code>Mo-Fr 11:00-19:00</code> then <code>Sa 10:00-16:00</code> on the next
            line.
          </p>
        </div>
        {suggested.length > 0 && b.openingHours.length === 0 && (
          <div className="admin-note">
            Read from your working hours (&ldquo;{settings.hours}&rdquo;) as{" "}
            <code>{suggested.join(", ")}</code> — that is what will be sent unless you
            type something above.{" "}
            <button
              type="button"
              className="admin-btn-sec"
              style={{ marginLeft: 6 }}
              onClick={() => patch({ openingHours: suggested })}
            >
              Use this
            </button>
          </div>
        )}
        {suggested.length === 0 && b.openingHours.length === 0 && (
          <div className="admin-note warn">
            Your working hours (&ldquo;{settings.hours}&rdquo;) couldn&apos;t be read
            automatically, so no hours are being sent to Google. Type them above.
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>What you sell</h2>
        <div className="admin-field">
          <label>Categories (one per line)</label>
          <textarea
            value={b.servesCuisine.join("\n")}
            onChange={(e) => patchList("servesCuisine", e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label>Other profiles (one URL per line)</label>
          <textarea
            value={b.sameAs.join("\n")}
            placeholder="https://www.facebook.com/…&#10;https://maps.google.com/…"
            onChange={(e) => patchList("sameAs", e.target.value)}
          />
          <p className="order-meta" style={{ marginTop: 4 }}>
            Your Instagram ({settings.instagramHandle}) is included automatically. Add
            Facebook, a Google Business Profile link, or anywhere else the bakery is
            listed — it helps Google connect them to you.
          </p>
        </div>
      </div>

      <details className="admin-card seo-jsonld">
        <summary>See exactly what is sent to Google</summary>
        <pre>{JSON.stringify(preview, null, 2)}</pre>
      </details>
    </>
  );
}
