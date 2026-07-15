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

// Raw form state saved so the customer's edit page can rehydrate the form exactly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OrderFormState = { values: Record<string, any>; qty: Record<string, number> };

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
    editToken: r.edit_token || undefined,
    formState: r.form_state || undefined,
    editedAt: r.edited_at ? new Date(r.edited_at).toISOString() : null,
    cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
  };
}

export async function createOrder(
  o: NewOrder,
  editToken?: string,
  formState?: OrderFormState,
  ip?: string,
  deviceToken?: string
): Promise<Order | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`INSERT INTO orders
    (name, phone, email, pickup_date, pickup_time, answers, edit_token, form_state, ip, device_token)
    VALUES (${o.name}, ${o.phone}, ${o.email}, ${o.pickupDate}, ${o.pickupTime},
            ${JSON.stringify(o.answers)}::jsonb, ${editToken || null},
            ${formState ? JSON.stringify(formState) : null}::jsonb, ${ip || null},
            ${deviceToken || null})
    RETURNING *`;
  return mapOrder(rows[0]);
}

// Active (still-editable) orders placed from a given device, newest first — so a
// returning visitor can view, edit or cancel their own orders. Matched by the
// device cookie, so it survives IP/WiFi changes and isn't shared across people.
export async function getActiveOrdersByDevice(deviceToken: string): Promise<Order[]> {
  if (!sql || !deviceToken) return [];
  await ensureDb();
  const rows = await sql`SELECT * FROM orders
    WHERE device_token = ${deviceToken} AND status IN ('new', 'confirmed') AND edit_token IS NOT NULL
    ORDER BY created_at DESC LIMIT 10`;
  return rows.map(mapOrder);
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!sql || !token) return null;
  await ensureDb();
  const rows = await sql`SELECT * FROM orders WHERE edit_token = ${token} LIMIT 1`;
  return rows.length ? mapOrder(rows[0]) : null;
}

export async function updateOrderByToken(
  token: string,
  o: NewOrder,
  formState?: OrderFormState
): Promise<Order | null> {
  if (!sql || !token) return null;
  await ensureDb();
  const rows = await sql`UPDATE orders SET
    name = ${o.name}, phone = ${o.phone}, email = ${o.email},
    pickup_date = ${o.pickupDate}, pickup_time = ${o.pickupTime},
    answers = ${JSON.stringify(o.answers)}::jsonb,
    form_state = ${formState ? JSON.stringify(formState) : null}::jsonb,
    edited_at = now()
    WHERE edit_token = ${token}
    RETURNING *`;
  return rows.length ? mapOrder(rows[0]) : null;
}

// Customer-initiated cancel: keep the row (so the bakery still sees it) but mark
// it cancelled and stamp the time.
export async function cancelOrderByToken(token: string): Promise<Order | null> {
  if (!sql || !token) return null;
  await ensureDb();
  const rows = await sql`UPDATE orders SET
    status = 'cancelled', cancelled_at = now()
    WHERE edit_token = ${token}
    RETURNING *`;
  return rows.length ? mapOrder(rows[0]) : null;
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
