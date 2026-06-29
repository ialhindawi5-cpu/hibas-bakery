import { neon } from "@neondatabase/serverless";
import { DEFAULT_SETTINGS, DEFAULT_MENU, DEFAULT_GALLERY } from "./defaults";

const url = process.env.DATABASE_URL;

export const dbConfigured = Boolean(url);

// Loosely typed neon tagged-template query function (null when DB not configured).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql: any = url ? neon(url) : null;

let initPromise: Promise<void> | null = null;

/** Lazily creates tables and seeds defaults the first time the DB is touched. */
export function ensureDb(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!initPromise) initPromise = init();
  return initPromise;
}

async function init() {
  await sql`CREATE TABLE IF NOT EXISTS settings (
    id int PRIMARY KEY DEFAULT 1,
    data jsonb NOT NULL,
    logo_data text,
    logo_mime text
  )`;
  await sql`CREATE TABLE IF NOT EXISTS menu_items (
    id serial PRIMARY KEY,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    image text,
    emoji text NOT NULL DEFAULT '🍰',
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gallery (
    id serial PRIMARY KEY,
    src text NOT NULL,
    alt text NOT NULL DEFAULT '',
    sort_order int NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    customer_status text DEFAULT '',
    items jsonb NOT NULL DEFAULT '[]',
    allergies text DEFAULT '',
    name text DEFAULT '',
    phone text DEFAULT '',
    email text DEFAULT '',
    contact_method text DEFAULT '',
    comments text DEFAULT '',
    pickup_date text DEFAULT '',
    pickup_time text DEFAULT '',
    status text NOT NULL DEFAULT 'new'
  )`;

  const s = await sql`SELECT id FROM settings WHERE id = 1`;
  if (s.length === 0) {
    await sql`INSERT INTO settings (id, data) VALUES (1, ${JSON.stringify(DEFAULT_SETTINGS)}::jsonb)`;
  }

  const m = await sql`SELECT count(*)::int AS c FROM menu_items`;
  if (m[0].c === 0) {
    for (const it of DEFAULT_MENU) {
      await sql`INSERT INTO menu_items (slug,name,description,image,emoji,sort_order,active)
        VALUES (${it.slug},${it.name},${it.description},${it.image},${it.emoji},${it.sortOrder},${it.active})`;
    }
  }

  const g = await sql`SELECT count(*)::int AS c FROM gallery`;
  if (g[0].c === 0) {
    for (const it of DEFAULT_GALLERY) {
      await sql`INSERT INTO gallery (src,alt,sort_order) VALUES (${it.src},${it.alt},${it.sortOrder})`;
    }
  }
}
