import { neon } from "@neondatabase/serverless";
import {
  DEFAULT_SETTINGS,
  DEFAULT_MENU,
  DEFAULT_GALLERY,
  DEFAULT_QUESTIONS,
} from "./defaults";
import { hashPassword } from "./password";

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
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_image_data text`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_image_mime text`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS draft jsonb`;
  await sql`CREATE TABLE IF NOT EXISTS settings_history (
    id serial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    label text NOT NULL DEFAULT '',
    data jsonb NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS menu_items (
    id serial PRIMARY KEY,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    image text,
    emoji text NOT NULL DEFAULT '🍰',
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    featured boolean NOT NULL DEFAULT false
  )`;
  // Add the `featured` column to pre-existing databases, and seed it once.
  const featCol = await sql`SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'featured'`;
  if (featCol.length === 0) {
    await sql`ALTER TABLE menu_items ADD COLUMN featured boolean NOT NULL DEFAULT false`;
    await sql`UPDATE menu_items SET featured = true WHERE image IS NOT NULL`;
  }
  await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_data text`;
  await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_mime text`;
  await sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS image_data text`;
  await sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS image_mime text`;
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
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '[]'`;

  await sql`CREATE TABLE IF NOT EXISTS messages (
    id serial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    name text NOT NULL DEFAULT '',
    email text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    message text NOT NULL DEFAULT '',
    is_read boolean NOT NULL DEFAULT false
  )`;

  await sql`CREATE TABLE IF NOT EXISTS questions (
    id serial PRIMARY KEY,
    qkey text NOT NULL,
    label text NOT NULL,
    type text NOT NULL DEFAULT 'text',
    options jsonb NOT NULL DEFAULT '[]',
    required boolean NOT NULL DEFAULT false,
    role text NOT NULL DEFAULT 'none',
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true
  )`;

  await sql`CREATE TABLE IF NOT EXISTS admin_users (
    id serial PRIMARY KEY,
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  // Seed the env-configured admin as the first user (so existing login keeps working).
  const au = await sql`SELECT count(*)::int AS c FROM admin_users`;
  if (au[0].c === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    await sql`INSERT INTO admin_users (username, password_hash)
      VALUES (${process.env.ADMIN_USERNAME}, ${hashPassword(process.env.ADMIN_PASSWORD)})
      ON CONFLICT (username) DO NOTHING`;
  }

  const s = await sql`SELECT id FROM settings WHERE id = 1`;
  if (s.length === 0) {
    await sql`INSERT INTO settings (id, data) VALUES (1, ${JSON.stringify(DEFAULT_SETTINGS)}::jsonb)`;
  }

  const m = await sql`SELECT count(*)::int AS c FROM menu_items`;
  if (m[0].c === 0) {
    for (const it of DEFAULT_MENU) {
      await sql`INSERT INTO menu_items (slug,name,description,image,emoji,sort_order,active,featured)
        VALUES (${it.slug},${it.name},${it.description},${it.image},${it.emoji},${it.sortOrder},${it.active},${it.featured})`;
    }
  }

  const g = await sql`SELECT count(*)::int AS c FROM gallery`;
  if (g[0].c === 0) {
    for (const it of DEFAULT_GALLERY) {
      await sql`INSERT INTO gallery (src,alt,sort_order) VALUES (${it.src},${it.alt},${it.sortOrder})`;
    }
  }

  const q = await sql`SELECT count(*)::int AS c FROM questions`;
  if (q[0].c === 0) {
    for (const it of DEFAULT_QUESTIONS) {
      await sql`INSERT INTO questions (qkey,label,type,options,required,role,sort_order,active)
        VALUES (${it.qkey},${it.label},${it.type},${JSON.stringify(it.options)}::jsonb,${it.required},${it.role},${it.sortOrder},${it.active})`;
    }
  }
}
