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

  // Build a self-contained, print-ready invoice and open the browser print
  // dialog (where the user picks "Save as PDF"). No server or extra deps.
  const downloadInvoice = (o: Order) => {
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const invNo = `INV-${String(o.id).padStart(4, "0")}`;
    const issued = fmtDate(o.createdAt);
    const total = orderTotal(o);
    const items = lineItems(o);
    const money = (n: number) => `$${n.toFixed(2)}`;

    const meta: [string, string][] = [
      ["Name", o.name || "—"],
      ["Phone", o.phone || "—"],
      ["Email", o.email || "—"],
      ["Pickup date", o.pickupDate || "—"],
      ["Pickup time", o.pickupTime || "—"],
    ];

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

    const title = `Invoice-${String(o.id).padStart(4, "0")}-${(o.name || "customer").replace(
      /\s+/g,
      "-"
    )}`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#3a2b1f;margin:0;padding:40px;background:#fff}
  .wrap{max-width:640px;margin:auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c2607a;padding-bottom:16px;margin-bottom:24px}
  .brand{font-size:22px;font-weight:bold;color:#c2607a}
  .brand small{display:block;font-size:12px;color:#8a7461;font-weight:normal;margin-top:2px}
  .inv-title{text-align:right}
  .inv-title h1{margin:0;font-size:26px;letter-spacing:2px;color:#3a2b1f}
  .inv-title div{font-size:13px;color:#8a7461;margin-top:4px}
  .meta{width:100%;font-size:14px;margin-bottom:24px;border-collapse:collapse}
  .meta td{padding:4px 0;vertical-align:top}
  .meta td:first-child{color:#8a7461;width:120px;font-weight:bold}
  table.items{width:100%;border-collapse:collapse;font-size:14px}
  table.items th{text-align:left;background:#faf0ec;padding:10px;border:1px solid #eee;color:#8a7461}
  table.items td{padding:10px;border:1px solid #eee}
  table.items td.amt,table.items th.amt{text-align:right;white-space:nowrap}
  .total{margin-top:18px;text-align:right;font-size:20px}
  .total strong{color:#c2607a}
  .foot{margin-top:40px;text-align:center;color:#8a7461;font-size:13px;border-top:1px solid #eee;padding-top:16px}
  @media print{body{padding:0}.noprint{display:none}}
  .noprint{margin-top:28px;text-align:center}
  .noprint button{background:#c2607a;color:#fff;border:0;padding:10px 22px;border-radius:9px;font-size:15px;cursor:pointer}
</style></head><body><div class="wrap">
  <div class="head">
    <div class="brand">Hiba's Bakery<small>Homemade with love</small></div>
    <div class="inv-title"><h1>INVOICE</h1><div>${esc(invNo)}</div><div>${esc(issued)}</div></div>
  </div>
  <table class="meta"><tbody>
    ${meta.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}
  </tbody></table>
  <table class="items"><thead><tr><th>Description</th><th class="amt">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  ${total > 0 ? `<div class="total">Total: <strong>${money(total)}</strong></div>` : ""}
  <div class="foot">Thank you for your order! · Hiba's Bakery</div>
  <div class="noprint"><button onclick="window.print()">Save as PDF / Print</button></div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups for this site to download the invoice.");
      return;
    }
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
