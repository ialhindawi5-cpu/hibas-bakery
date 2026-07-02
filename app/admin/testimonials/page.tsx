"use client";

import { useEffect, useState, useCallback } from "react";
import type { Testimonial, TestimonialStatus } from "@/app/lib/testimonials";

const STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/testimonials", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load testimonials");
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(t: Testimonial, status: TestimonialStatus) {
    setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, status } : x)));
    await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function remove(t: Testimonial) {
    if (!confirm(`Delete the review from "${t.name}"?`)) return;
    await fetch(`/api/admin/testimonials/${t.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== t.id));
  }

  const fmt = (iso: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const pending = items.filter((t) => t.status === "pending").length;

  return (
    <>
      <h1 className="admin-h1">Testimonials</h1>
      <p className="admin-sub">
        Reviews submitted by customers. Only <strong>approved</strong> reviews appear on the
        home page. Pending reviews are hidden until you approve them.
      </p>

      <div className="admin-actions" style={{ marginBottom: 18 }}>
        <button className="admin-btn-sec" onClick={load}>
          ↻ Refresh
        </button>
        <span className="order-meta">
          {items.length} review(s){pending > 0 ? ` · ${pending} awaiting review` : ""}
        </span>
      </div>

      {error && <div className="admin-note err">{error}</div>}
      {loading && <p className="order-meta">Loading…</p>}

      {!loading && items.length === 0 && !error && (
        <div className="admin-card">
          <p className="order-meta">No reviews yet.</p>
        </div>
      )}

      {items.map((t) => (
        <div className="order-card" key={t.id}>
          <div className="order-head">
            <div>
              <span className="order-name">{t.name || "Anonymous"}</span>{" "}
              <span className={`badge status-${t.status}`}>{t.status}</span>
              <div className="order-meta">
                <span style={{ color: "var(--accent)", letterSpacing: 2 }}>
                  {STARS(t.rating)}
                </span>{" "}
                · {fmt(t.createdAt)}
              </div>
            </div>
          </div>
          <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 12px", fontStyle: "italic" }}>
            “{t.quote}”
          </p>
          <div className="admin-actions">
            {t.status !== "approved" && (
              <button className="admin-btn" onClick={() => setStatus(t, "approved")}>
                Approve
              </button>
            )}
            {t.status !== "declined" && (
              <button className="admin-btn-sec" onClick={() => setStatus(t, "declined")}>
                Decline
              </button>
            )}
            {t.status !== "pending" && (
              <button className="admin-btn-sec" onClick={() => setStatus(t, "pending")}>
                Reset to pending
              </button>
            )}
            <button className="admin-btn-danger" onClick={() => remove(t)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
