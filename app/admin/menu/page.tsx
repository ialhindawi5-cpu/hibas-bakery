"use client";

import { useState } from "react";
import MenuManager from "../components/MenuManager";
import PricesEditor from "../components/PricesEditor";

type Tab = "items" | "prices";

export default function AdminMenuPage() {
  const [tab, setTab] = useState<Tab>("items");

  return (
    <>
      <h1 className="admin-h1">Menu &amp; Prices</h1>
      <p className="admin-sub" style={{ marginBottom: 14 }}>
        Your menu items and their sizes &amp; prices.
      </p>

      <div className="settings-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "items"}
          className={tab === "items" ? "active" : ""}
          onClick={() => setTab("items")}
        >
          Menu Items
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "prices"}
          className={tab === "prices" ? "active" : ""}
          onClick={() => setTab("prices")}
        >
          Prices
        </button>
      </div>

      {/* Both stay mounted so edits aren't lost when switching tabs. */}
      <div style={{ display: tab === "items" ? "block" : "none" }}>
        <MenuManager />
      </div>
      <div style={{ display: tab === "prices" ? "block" : "none" }}>
        <PricesEditor />
      </div>
    </>
  );
}
