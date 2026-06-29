"use client";

import { useEffect, useState, useCallback } from "react";
import type { Order } from "@/app/lib/types";

const STATUSES: Order["status"][] = ["new", "confirmed", "completed", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <>
      <h1 className="admin-h1">Orders</h1>
      <p className="admin-sub">
        Order requests submitted through the website. New orders are also emailed to you.
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

      {orders.map((o) => (
        <div className="order-card" key={o.id}>
          <div className="order-head">
            <div>
              <span className="order-name">{o.name}</span>{" "}
              <span className={`badge ${o.status}`}>{o.status}</span>
            </div>
            <span className="order-meta">
              #{o.id} · {fmtDate(o.createdAt)}
            </span>
          </div>

          <div className="order-grid">
            <div>
              <b>Items:</b> {o.items.join(", ")}
            </div>
            <div>
              <b>Phone:</b> {o.phone}
            </div>
            <div>
              <b>Email:</b> {o.email || "—"}
            </div>
            <div>
              <b>Prefers:</b> {o.contactMethod}
            </div>
            <div>
              <b>Pickup:</b> {o.pickupDate} {o.pickupTime}
            </div>
            <div>
              <b>Customer:</b> {o.customerStatus}
            </div>
            {o.allergies && (
              <div>
                <b>Allergies:</b> {o.allergies}
              </div>
            )}
            {o.comments && (
              <div>
                <b>Comments:</b> {o.comments}
              </div>
            )}
          </div>

          <div className="admin-actions">
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
            <button className="admin-btn-danger" onClick={() => remove(o.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
