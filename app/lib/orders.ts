import { sql, ensureDb, dbConfigured } from "./db";
import type { Order, OrderAnswer } from "./types";

export type NewOrder = {
  name: string;
  phone: string;
  email: string;
  pickupDate: string;
  pickupTime: string;
  answers: OrderAnswer[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(r: any): Order {
  return {
    id: r.id,
    createdAt:
      typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    name: r.name,
    phone: r.phone,
    email: r.email,
    pickupDate: r.pickup_date,
    pickupTime: r.pickup_time,
    answers: Array.isArray(r.answers) ? r.answers : [],
    status: r.status,
  };
}

export async function createOrder(o: NewOrder): Promise<Order | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`INSERT INTO orders
    (name, phone, email, pickup_date, pickup_time, answers)
    VALUES (${o.name}, ${o.phone}, ${o.email}, ${o.pickupDate}, ${o.pickupTime},
            ${JSON.stringify(o.answers)}::jsonb)
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
