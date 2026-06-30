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

  // Sum every "$<amount>" found across the order's answers (prices live in the option text).
  const orderTotal = (o: Order): number => {
    let total = 0;
    for (const a of o.answers) {
      const matches = Array.from(a.value.matchAll(/\$\s*(\d+(?:\.\d{1,2})?)/g));
      for (const m of matches) total += parseFloat(m[1]);
    }
    return total;
  };

  const summary = (o: Order) => {
    const items = o.answers.find((a) => /order|item/i.test(a.label))?.value;
    return items || o.phone || "Click to view full submission";
  };

  return (
    <>
      <h1 className="admin-h1">Orders</h1>
      <p className="admin-sub">
        Click an order to see everything the customer submitted. New orders are also emailed to you.
      </p>

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
