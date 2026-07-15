"use client";

import { useEffect, useState, useCallback } from "react";
import type { Order } from "@/app/lib/types";

const STATUSES: Order["status"][] = ["new", "confirmed", "completed", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load orders");
      setOrders(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: Order["status"]) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function remove(id: number) {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  // Prices live in the option text ("$45"). The order form appends an authoritative
  // "Grand Total" answer, so prefer that; otherwise sum the priced item options.
  // (Summing every "$<amount>" — including the Grand Total field — double-counts.)
  const isTotalLabel = (label: string) => /\btotal\b/i.test(label);

  const orderTotal = (o: Order): number => {
    const grand = o.answers.find((a) => isTotalLabel(a.label));
    if (grand) {
      const m = grand.value.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
      if (m) return parseFloat(m[1]);
    }
    let total = 0;
    for (const a of o.answers) {
      if (isTotalLabel(a.label)) continue; // skip total fields to avoid double-counting
      const matches = Array.from(a.value.matchAll(/\$\s*(\d+(?:\.\d{1,2})?)/g));
      for (const m of matches) total += parseFloat(m[1]);
    }
    return total;
  };

  const summary = (o: Order) => {
    const items = o.answers.find((a) => /order|item/i.test(a.label))?.value;
    return items || o.phone || "Click to view full submission";
  };

  // Split the order field ("Item A - $30, Item B - $15") into invoice line items.
  const lineItems = (o: Order): { desc: string; amount: number | null }[] => {
    const field = o.answers.find((a) => /order|item/i.test(a.label))?.value || "";
    return field
      .split(", ")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = s.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
        const desc = s.replace(/\s*-?\s*\$\s*\d+(?:\.\d{1,2})?\s*$/, "").replace(/\s*-\s*$/, "").trim();
        return { desc: desc || s, amount: m ? parseFloat(m[1]) : null };
      });
  };

  // Fallback emblem (matches the site's <Logo> SVG) when no logo image is set.
  const LOGO_FALLBACK = `<svg width="64" height="64" viewBox="0 0 100 100" role="img" aria-label="Bakery logo">
    <defs><linearGradient id="lr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0a0b0"/><stop offset="1" stop-color="#c2607a"/></linearGradient></defs>
    <circle cx="50" cy="50" r="48" fill="#fff6f1" stroke="url(#lr)" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="#eccfca" stroke-width="1" stroke-dasharray="1.5 3.5"/>
    <path d="M50 28c-1.6-3-7-3-7 1.4 0 3 4 5.6 7 8 3-2.4 7-5 7-8 0-4.4-5.4-4.4-7-1.4z" fill="#d98ca0"/>
    <text x="50" y="68" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="700" fill="#5a3220">H</text>
  </svg>`;

  // Fetch the configured logo as a data URL so it renders reliably in the PDF.
  const fetchLogo = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/logo", { cache: "no-store" });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Build a self-contained, print-ready invoice and open the browser print
  // dialog (where the user picks "Save as PDF"). No server or extra deps.
  const downloadInvoice = async (o: Order) => {
    // Open the window synchronously (on the click) so pop-up blockers allow it.
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups for this site to download the invoice.");
      return;
    }
    w.document.write(
      `<p style="font-family:Arial,sans-serif;color:#8a7461;padding:40px">Preparing invoice…</p>`
    );

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const invNo = `INV-${String(o.id).padStart(4, "0")}`;
    const issued = fmtDate(o.createdAt);
    const total = orderTotal(o);
    const items = lineItems(o);
    const money = (n: number) => `$${n.toFixed(2)}`;

    const logoData = await fetchLogo();
    const logo = logoData
      ? `<img class="logo" src="${logoData}" alt="Hiba's Bakery logo" />`
      : LOGO_FALLBACK;

    const rows =
      items.length > 0
        ? items
            .map(
              (it) =>
                `<tr><td>${esc(it.desc)}</td><td class="amt">${
                  it.amount != null ? money(it.amount) : "—"
                }</td></tr>`
            )
            .join("")
        : `<tr><td>Order</td><td class="amt">${total > 0 ? money(total) : "—"}</td></tr>`;

    const billed: [string, string][] = [
      ["Name", o.name || "—"],
      ["Phone", o.phone || "—"],
      ["Email", o.email || "—"],
    ];
    const details: [string, string][] = [
      ["Invoice no.", invNo],
      ["Issued", issued],
      ["Status", (o.status || "—").replace(/^./, (c) => c.toUpperCase())],
      ["Pickup date", o.pickupDate || "—"],
      ["Pickup time", o.pickupTime || "—"],
    ];
    const infoBlock = (heading: string, pairs: [string, string][]) =>
      `<div class="info"><h3>${heading}</h3>${pairs
        .map(([k, v]) => `<div class="row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
        .join("")}</div>`;

    const title = `Invoice-${String(o.id).padStart(4, "0")}-${(o.name || "customer").replace(
      /\s+/g,
      "-"
    )}`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  :root{--accent:#c2607a;--ink:#3a2b1f;--muted:#96826f;--line:#efe5df;--soft:#fbf3ef}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:#f4ede8;padding:32px}
  .sheet{max-width:720px;margin:auto;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .band{height:6px;background:linear-gradient(90deg,#e0a0b0,#c2607a)}
  .pad{padding:38px 44px}
  .head{display:flex;justify-content:space-between;align-items:center;gap:20px}
  .brand{display:flex;align-items:center;gap:14px}
  .brand .logo,.brand svg{width:60px;height:60px;object-fit:contain;border-radius:10px}
  .brand-name{font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;color:var(--accent);line-height:1.1}
  .brand-name small{display:block;font-family:Arial,sans-serif;font-size:12px;color:var(--muted);font-weight:400;margin-top:3px;letter-spacing:.3px}
  .inv h1{margin:0;font-family:Georgia,serif;font-size:30px;letter-spacing:4px;color:var(--ink);text-align:right}
  .inv .sub{text-align:right;font-size:13px;color:var(--muted);margin-top:4px}
  .rule{height:1px;background:var(--line);margin:26px 0}
  .cols{display:flex;gap:24px}
  .info{flex:1}
  .info h3{margin:0 0 10px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent)}
  .info .row{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:3px 0}
  .info .row span{color:var(--muted)}
  .info .row b{font-weight:600;text-align:right}
  table.items{width:100%;border-collapse:collapse;font-size:14px;margin-top:28px}
  table.items th{text-align:left;background:var(--soft);padding:12px 14px;color:var(--muted);font-size:12px;letter-spacing:.5px;text-transform:uppercase;border-bottom:2px solid var(--line)}
  table.items td{padding:13px 14px;border-bottom:1px solid var(--line)}
  table.items tr:last-child td{border-bottom:0}
  table.items td.amt,table.items th.amt{text-align:right;white-space:nowrap}
  .totals{display:flex;justify-content:flex-end;margin-top:22px}
  .totals .box{min-width:240px}
  .totals .line{display:flex;justify-content:space-between;font-size:14px;color:var(--muted);padding:4px 0}
  .totals .grand{display:flex;justify-content:space-between;align-items:center;margin-top:8px;background:var(--soft);border-radius:10px;padding:12px 16px;font-size:18px;font-weight:700}
  .totals .grand b{color:var(--accent);font-size:20px}
  .foot{margin-top:34px;padding-top:18px;border-top:1px solid var(--line);text-align:center;color:var(--muted);font-size:12.5px;line-height:1.7}
  .foot .thanks{font-family:Georgia,serif;color:var(--accent);font-size:15px}
  .noprint{max-width:720px;margin:18px auto 0;text-align:center}
  .noprint button{background:var(--accent);color:#fff;border:0;padding:11px 26px;border-radius:10px;font-size:15px;cursor:pointer;box-shadow:0 4px 12px rgba(194,96,122,.3)}
  @page{margin:14mm}
  @media print{body{background:#fff;padding:0}.sheet{border:0;border-radius:0;max-width:none}.noprint{display:none}}
</style></head><body>
  <div class="sheet">
    <div class="band"></div>
    <div class="pad">
      <div class="head">
        <div class="brand">${logo}<div class="brand-name">Hiba's Bakery<small>Homemade with love</small></div></div>
        <div class="inv"><h1>INVOICE</h1><div class="sub">${esc(invNo)} · ${esc(issued)}</div></div>
      </div>
      <div class="rule"></div>
      <div class="cols">
        ${infoBlock("Billed to", billed)}
        ${infoBlock("Order details", details)}
      </div>
      <table class="items"><thead><tr><th>Description</th><th class="amt">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      ${
        total > 0
          ? `<div class="totals"><div class="box">
              <div class="line"><span>Subtotal</span><span>${money(total)}</span></div>
              <div class="grand"><span>Total</span><b>${money(total)}</b></div>
            </div></div>`
          : ""
      }
      <div class="foot">
        <div class="thanks">Thank you for your order!</div>
        Hiba's Bakery · Pickup at 267 Aquilo Crescent · Instagram @hibas_bakery_
      </div>
    </div>
  </div>
  <div class="noprint"><button onclick="window.print()">Save as PDF / Print</button></div>
<script>window.onload=function(){setTimeout(function(){window.print();},350);};</script>
</body></html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <>
      <h1 className="admin-h1">Orders</h1>
      <p className="admin-sub">
        Click an order to see everything the customer submitted. New orders are also emailed to you.
      </p>

      {orders.length > 0 && (
        <div className="profit-summary">
          <div>
            <span className="profit-label">Total from all orders</span>
            <span className="profit-value">
              ${orders.reduce((sum, o) => sum + orderTotal(o), 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="profit-label">New (unconfirmed)</span>
            <span className="profit-value sm">
              $
              {orders
                .filter((o) => o.status === "new")
                .reduce((sum, o) => sum + orderTotal(o), 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="admin-actions" style={{ marginBottom: 18 }}>
        <button className="admin-btn-sec" onClick={load}>
          ↻ Refresh
        </button>
        <span className="order-meta">{orders.length} order(s)</span>
      </div>

      {error && <div className="admin-note err">{error}</div>}
      {loading && <p className="order-meta">Loading…</p>}

      {!loading && orders.length === 0 && !error && (
        <div className="admin-card">
          <p className="order-meta">
            No orders yet. When a customer submits the order form, it will appear here
            (and arrive in your email).
          </p>
        </div>
      )}

      {orders.map((o) => {
        const open = openId === o.id;
        const filled = o.answers.filter((a) => a.value && a.value.trim());
        const total = orderTotal(o);
        return (
          <div className="order-card" key={o.id}>
            {/* Clickable header */}
            <button
              type="button"
              className="order-toggle"
              onClick={() => setOpenId(open ? null : o.id)}
              aria-expanded={open}
            >
              <div>
                <span className="order-name">{o.name || "Order"}</span>{" "}
                <span className={`badge ${o.status}`}>{o.status}</span>
                {total > 0 && <span className="order-total">${total.toFixed(2)}</span>}
                {!open && <div className="order-summary-line">{summary(o)}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="order-meta">
                  #{o.id} · {fmtDate(o.createdAt)}
                </div>
                <div className="order-chevron">{open ? "▴ Hide" : "▾ View"}</div>
              </div>
            </button>

            {/* Expanded detail */}
            {open && (
              <div className="order-detail">
                {filled.length === 0 ? (
                  <p className="order-meta">
                    No detailed answers were saved for this order (it may predate the order-form
                    system).
                  </p>
                ) : (
                  <dl className="order-dl">
                    {filled.map((a, i) => (
                      <div className="order-dl-row" key={i}>
                        <dt>{a.label}</dt>
                        <dd>{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {total > 0 && (
                  <div className="order-total-row">
                    Order total: <strong>${total.toFixed(2)}</strong>
                  </div>
                )}

                <div className="admin-actions" style={{ marginTop: 16 }}>
                  <label style={{ fontWeight: 600, marginRight: 4 }}>Status:</label>
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value as Order["status"])}
                    style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)" }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {o.email && (
                    <a className="admin-btn-sec" href={`mailto:${o.email}`}>
                      Email customer
                    </a>
                  )}
                  <button className="admin-btn-sec" onClick={() => downloadInvoice(o)}>
                    Invoice (PDF)
                  </button>
                  <button className="admin-btn-danger" onClick={() => remove(o.id)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
