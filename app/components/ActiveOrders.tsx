import Link from "next/link";
import type { Order } from "../lib/types";

function summarize(o: Order): string {
  const items = o.answers.find((a) => /order|item/i.test(a.label))?.value;
  return items || "Your order";
}

function totalOf(o: Order): string {
  const g = o.answers.find((a) => /\btotal\b/i.test(a.label));
  return g?.value || "";
}

function fmtPickup(o: Order): string {
  const parts = [o.pickupDate, o.pickupTime].filter(Boolean);
  return parts.length ? `Pickup ${parts.join(" · ")}` : "";
}

/**
 * Shown on the order page below the form: the visitor's own active orders
 * (matched by the IP they submitted from), each linking to its edit/cancel page.
 */
export default function ActiveOrders({ orders }: { orders: Order[] }) {
  if (!orders.length) return null;
  return (
    <div className="active-orders">
      <h2 className="active-orders-title">Your active orders</h2>
      <p className="active-orders-sub">
        Orders you&apos;ve placed from this device. You can view, edit or cancel them any time
        until pickup.
      </p>
      {orders.map((o) => {
        const total = totalOf(o);
        return (
          <div className="active-order-card" key={o.id}>
            <div className="active-order-info">
              <div className="active-order-head">
                <span className="active-order-id">Order #{o.id}</span>
                <span className={`ao-badge ${o.status}`}>{o.status}</span>
                {total && <span className="active-order-total">{total}</span>}
              </div>
              <div className="active-order-summary">{summarize(o)}</div>
              {fmtPickup(o) && <div className="active-order-date">{fmtPickup(o)}</div>}
            </div>
            <Link className="active-order-btn" href={`/order/edit/${o.editToken}`}>
              View / Edit
            </Link>
          </div>
        );
      })}
    </div>
  );
}
