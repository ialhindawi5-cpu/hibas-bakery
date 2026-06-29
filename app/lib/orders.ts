import { sql, ensureDb, dbConfigured } from "./db";
import type { Order } from "./types";

export type NewOrder = Omit<Order, "id" | "createdAt" | "status">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(r: any): Order {
  return {
    id: r.id,
    createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    customerStatus: r.customer_status,
    items: Array.isArray(r.items) ? r.items : [],
    allergies: r.allergies,
    name: r.name,
    phone: r.phone,
    email: r.email,
    contactMethod: r.contact_method,
    comments: r.comments,
    pickupDate: r.pickup_date,
    pickupTime: r.pickup_time,
    status: r.status,
  };
}

export async function createOrder(o: NewOrder): Promise<Order | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`INSERT INTO orders
    (customer_status, items, allergies, name, phone, email, contact_method, comments, pickup_date, pickup_time)
    VALUES (${o.customerStatus}, ${JSON.stringify(o.items)}::jsonb, ${o.allergies}, ${o.name},
            ${o.phone}, ${o.email}, ${o.contactMethod}, ${o.comments}, ${o.pickupDate}, ${o.pickupTime})
    RETURNING *`;
  return mapOrder(rows[0]);
}

export async function listOrders(): Promise<Order[]> {
  if (!sql) return [];
  await ensureDb();
  const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
  return rows.map(mapOrder);
}

export async function updateOrderStatus(id: number, status: Order["status"]): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE orders SET status=${status} WHERE id=${id}`;
}

export async function deleteOrder(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`DELETE FROM orders WHERE id=${id}`;
}

export { dbConfigured };
