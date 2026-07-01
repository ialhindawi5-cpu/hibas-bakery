import fs from "fs";
import path from "path";
import { sql, ensureDb } from "./db";
import {
  DEFAULT_SETTINGS,
  DEFAULT_MENU,
  DEFAULT_GALLERY,
  DEFAULT_QUESTIONS,
} from "./defaults";
import type { Settings, MenuItem, GalleryImage, Question } from "./types";

/* ---------------- Settings ---------------- */

export async function getSettings(): Promise<Settings> {
  if (!sql) return DEFAULT_SETTINGS;
  await ensureDb();
  const rows = await sql`SELECT data FROM settings WHERE id = 1`;
  if (rows.length === 0) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(rows[0].data as Partial<Settings>) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const next = { ...(await getSettings()), ...patch };
  await sql`UPDATE settings SET data = ${JSON.stringify(next)}::jsonb WHERE id = 1`;
  return next;
}

/* ---------------- Draft / Publish ---------------- */

// The admin edits a DRAFT; the public site reads the PUBLISHED `data`.
export async function getDraftSettings(): Promise<Settings> {
  if (!sql) return DEFAULT_SETTINGS;
  await ensureDb();
  const rows = await sql`SELECT data, draft FROM settings WHERE id = 1`;
  if (rows.length === 0) return DEFAULT_SETTINGS;
  const base = (rows[0].draft as Partial<Settings> | null) ?? (rows[0].data as Partial<Settings>);
  return { ...DEFAULT_SETTINGS, ...base };
}

// Save changes to the draft only (does NOT affect the live site).
export async function saveDraft(patch: Partial<Settings>): Promise<Settings> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const next = { ...(await getDraftSettings()), ...patch };
  await sql`UPDATE settings SET draft = ${JSON.stringify(next)}::jsonb WHERE id = 1`;
  return next;
}

// Make the draft live.
export async function publishSettings(): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE settings SET data = COALESCE(draft, data), draft = NULL WHERE id = 1`;
}

// Throw away unpublished changes.
export async function discardDraft(): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE settings SET draft = NULL WHERE id = 1`;
}

export async function hasUnpublishedChanges(): Promise<boolean> {
  if (!sql) return false;
  await ensureDb();
  const rows = await sql`SELECT (draft IS NOT NULL AND draft::text <> data::text) AS d
    FROM settings WHERE id = 1`;
  return rows.length ? Boolean(rows[0].d) : false;
}

/* ---------------- Menu ---------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMenu(r: any): MenuItem {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    image: r.image,
    emoji: r.emoji,
    sortOrder: r.sort_order,
    active: r.active,
    featured: r.featured ?? false,
  };
}

export async function getMenu(opts?: { activeOnly?: boolean }): Promise<MenuItem[]> {
  if (!sql) {
    const list = DEFAULT_MENU.map((m, i) => ({ id: i + 1, ...m }));
    return opts?.activeOnly ? list.filter((m) => m.active) : list;
  }
  await ensureDb();
  const rows = opts?.activeOnly
    ? await sql`SELECT * FROM menu_items WHERE active = true ORDER BY sort_order, id`
    : await sql`SELECT * FROM menu_items ORDER BY sort_order, id`;
  return rows.map(mapMenu);
}

export async function getFeaturedMenu(): Promise<MenuItem[]> {
  if (!sql) {
    return DEFAULT_MENU.map((m, i) => ({ id: i + 1, ...m })).filter(
      (m) => m.active && m.featured
    );
  }
  await ensureDb();
  const rows = await sql`SELECT * FROM menu_items WHERE active = true AND featured = true
    ORDER BY sort_order, id`;
  return rows.map(mapMenu);
}

export async function addMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const rows = await sql`INSERT INTO menu_items (slug,name,description,image,emoji,sort_order,active,featured)
    VALUES (${item.slug},${item.name},${item.description},${item.image},${item.emoji},${item.sortOrder},${item.active},${item.featured})
    RETURNING *`;
  return mapMenu(rows[0]);
}

export async function updateMenuItem(id: number, patch: Partial<MenuItem>): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const items = await getMenu();
  const cur = items.find((i) => i.id === id);
  if (!cur) throw new Error("Menu item not found");
  const n = { ...cur, ...patch };
  await sql`UPDATE menu_items SET
    slug=${n.slug}, name=${n.name}, description=${n.description}, image=${n.image},
    emoji=${n.emoji}, sort_order=${n.sortOrder}, active=${n.active}, featured=${n.featured}
    WHERE id=${id}`;
}

export async function deleteMenuItem(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`DELETE FROM menu_items WHERE id=${id}`;
}

export async function setMenuImage(id: number, base64: string, mime: string): Promise<string> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const url = `/api/menu-image/${id}?v=${Date.now()}`;
  await sql`UPDATE menu_items SET image_data=${base64}, image_mime=${mime}, image=${url} WHERE id=${id}`;
  return url;
}

export async function getMenuImage(id: number): Promise<{ data: Buffer; mime: string } | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`SELECT image_data, image_mime FROM menu_items WHERE id=${id}`;
  if (!rows.length || !rows[0].image_data) return null;
  return {
    data: Buffer.from(rows[0].image_data, "base64"),
    mime: rows[0].image_mime || "image/jpeg",
  };
}

export async function clearMenuImage(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE menu_items SET image_data=NULL, image_mime=NULL, image=NULL WHERE id=${id}`;
}

/* ---------------- Gallery ---------------- */

export async function getGallery(): Promise<GalleryImage[]> {
  if (!sql) return DEFAULT_GALLERY.map((g, i) => ({ id: i + 1, ...g }));
  await ensureDb();
  const rows = await sql`SELECT * FROM gallery ORDER BY sort_order, id`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ id: r.id, src: r.src, alt: r.alt, sortOrder: r.sort_order }));
}

export async function addGalleryImage(
  base64: string,
  mime: string,
  alt: string
): Promise<GalleryImage> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const max = await sql`SELECT COALESCE(MAX(sort_order),0)::int AS m FROM gallery`;
  const sortOrder = max[0].m + 1;
  const ins = await sql`INSERT INTO gallery (src, alt, sort_order, image_data, image_mime)
    VALUES ('', ${alt}, ${sortOrder}, ${base64}, ${mime}) RETURNING id`;
  const id = ins[0].id as number;
  const src = `/api/gallery-image/${id}?v=${Date.now()}`;
  await sql`UPDATE gallery SET src=${src} WHERE id=${id}`;
  return { id, src, alt, sortOrder };
}

export async function updateGalleryImage(
  id: number,
  patch: { alt?: string; sortOrder?: number }
): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  if (patch.alt !== undefined) await sql`UPDATE gallery SET alt=${patch.alt} WHERE id=${id}`;
  if (patch.sortOrder !== undefined)
    await sql`UPDATE gallery SET sort_order=${patch.sortOrder} WHERE id=${id}`;
}

export async function deleteGalleryImage(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`DELETE FROM gallery WHERE id=${id}`;
}

export async function getGalleryImageData(
  id: number
): Promise<{ data: Buffer; mime: string } | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`SELECT image_data, image_mime FROM gallery WHERE id=${id}`;
  if (!rows.length || !rows[0].image_data) return null;
  return {
    data: Buffer.from(rows[0].image_data, "base64"),
    mime: rows[0].image_mime || "image/jpeg",
  };
}

/* ---------------- Questions (order form builder) ---------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuestion(r: any): Question {
  return {
    id: r.id,
    qkey: r.qkey,
    label: r.label,
    type: r.type,
    options: Array.isArray(r.options) ? r.options : [],
    required: r.required,
    role: r.role,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

export async function getQuestions(opts?: { activeOnly?: boolean }): Promise<Question[]> {
  if (!sql) {
    const list = DEFAULT_QUESTIONS.map((q, i) => ({ id: i + 1, ...q }));
    return opts?.activeOnly ? list.filter((q) => q.active) : list;
  }
  await ensureDb();
  const rows = opts?.activeOnly
    ? await sql`SELECT * FROM questions WHERE active = true ORDER BY sort_order, id`
    : await sql`SELECT * FROM questions ORDER BY sort_order, id`;
  return rows.map(mapQuestion);
}

export async function addQuestion(q: Omit<Question, "id">): Promise<Question> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const rows = await sql`INSERT INTO questions (qkey,label,type,options,required,role,sort_order,active)
    VALUES (${q.qkey},${q.label},${q.type},${JSON.stringify(q.options)}::jsonb,${q.required},${q.role},${q.sortOrder},${q.active})
    RETURNING *`;
  return mapQuestion(rows[0]);
}

export async function updateQuestion(id: number, patch: Partial<Question>): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const all = await getQuestions();
  const cur = all.find((q) => q.id === id);
  if (!cur) throw new Error("Question not found");
  const n = { ...cur, ...patch };
  await sql`UPDATE questions SET
    qkey=${n.qkey}, label=${n.label}, type=${n.type}, options=${JSON.stringify(n.options)}::jsonb,
    required=${n.required}, role=${n.role}, sort_order=${n.sortOrder}, active=${n.active}
    WHERE id=${id}`;
}

export async function deleteQuestion(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`DELETE FROM questions WHERE id=${id}`;
}

/* ---------------- Logo ---------------- */

export async function getLogoInfo(): Promise<{ hasLogo: boolean; src: string | null }> {
  if (sql) {
    await ensureDb();
    const rows = await sql`SELECT (logo_data IS NOT NULL) AS has FROM settings WHERE id = 1`;
    if (rows.length && rows[0].has) return { hasLogo: true, src: "/api/logo" };
  }
  try {
    if (fs.existsSync(path.join(process.cwd(), "public", "logo.png"))) {
      return { hasLogo: true, src: "/logo.png" };
    }
  } catch {
    /* ignore */
  }
  return { hasLogo: false, src: null };
}

export async function getLogoData(): Promise<{ data: Buffer; mime: string } | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`SELECT logo_data, logo_mime FROM settings WHERE id = 1`;
  if (!rows.length || !rows[0].logo_data) return null;
  return { data: Buffer.from(rows[0].logo_data, "base64"), mime: rows[0].logo_mime || "image/png" };
}

export async function setLogo(base64: string, mime: string): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE settings SET logo_data=${base64}, logo_mime=${mime} WHERE id = 1`;
}

export async function clearLogo(): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE settings SET logo_data=NULL, logo_mime=NULL WHERE id = 1`;
}

/* ---------------- About image ---------------- */

export async function setAboutImage(base64: string, mime: string): Promise<string> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  const url = `/api/about-image?v=${Date.now()}`;
  await sql`UPDATE settings SET about_image_data=${base64}, about_image_mime=${mime} WHERE id = 1`;
  await saveDraft({ aboutImage: url });
  return url;
}

export async function getAboutImageData(): Promise<{ data: Buffer; mime: string } | null> {
  if (!sql) return null;
  await ensureDb();
  const rows = await sql`SELECT about_image_data, about_image_mime FROM settings WHERE id = 1`;
  if (!rows.length || !rows[0].about_image_data) return null;
  return {
    data: Buffer.from(rows[0].about_image_data, "base64"),
    mime: rows[0].about_image_mime || "image/jpeg",
  };
}

export async function clearAboutImage(): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE settings SET about_image_data=NULL, about_image_mime=NULL WHERE id = 1`;
  await saveDraft({ aboutImage: "/images/sourdough.jpg" });
}
