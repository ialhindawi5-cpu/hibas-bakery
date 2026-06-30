import { sql, ensureDb } from "./db";

export type Message = {
  id: number;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
};

export type NewMessage = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(r: any): Message {
  return {
    id: r.id,
    createdAt:
      typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    read: r.is_read,
  };
}

export async function createMessage(m: NewMessage): Promise<Message | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`INSERT INTO messages (name, email, phone, message)
    VALUES (${m.name}, ${m.email}, ${m.phone}, ${m.message}) RETURNING *`;
  return mapMessage(rows[0]);
}

export async function listMessages(): Promise<Message[]> {
  if (!sql) return [];
  await ensureDb();
  const rows = await sql`SELECT * FROM messages ORDER BY created_at DESC`;
  return rows.map(mapMessage);
}

export async function setMessageRead(id: number, read: boolean): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE messages SET is_read = ${read} WHERE id = ${id}`;
}

export async function deleteMessage(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`DELETE FROM messages WHERE id = ${id}`;
}
