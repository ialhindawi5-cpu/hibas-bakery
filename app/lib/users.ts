import { sql, ensureDb } from "./db";
import { hashPassword, verifyPassword } from "./password";

export type AdminUser = { id: number; username: string; createdAt: string };

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (!sql) {
    // No database: fall back to env credentials.
    const u = process.env.ADMIN_USERNAME || "admin";
    const p = process.env.ADMIN_PASSWORD || "";
    return Boolean(p) && username === u && password === p;
  }
  await ensureDb();
  const rows = await sql`SELECT password_hash FROM admin_users WHERE username = ${username}`;
  if (!rows.length) return false;
  return verifyPassword(password, rows[0].password_hash as string);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  if (!sql) return [];
  await ensureDb();
  const rows = await sql`SELECT id, username, created_at FROM admin_users ORDER BY id`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    id: r.id,
    username: r.username,
    createdAt:
      typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
  }));
}

export async function adminUserExists(username: string): Promise<boolean> {
  if (!sql) return false;
  await ensureDb();
  const rows = await sql`SELECT 1 FROM admin_users WHERE lower(username) = lower(${username})`;
  return rows.length > 0;
}

export async function createAdminUser(username: string, password: string): Promise<AdminUser> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  if (await adminUserExists(username)) throw new Error("That username already exists");
  const rows = await sql`INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${hashPassword(password)})
    RETURNING id, username, created_at`;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    createdAt:
      typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

export async function resetAdminPassword(id: number, password: string): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE admin_users SET password_hash = ${hashPassword(password)} WHERE id = ${id}`;
}

export async function deleteAdminUser(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const count = await sql`SELECT count(*)::int AS c FROM admin_users`;
  if (count[0].c <= 1) throw new Error("Can't delete the only admin user");
  await sql`DELETE FROM admin_users WHERE id = ${id}`;
}
