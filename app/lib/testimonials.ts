import { sql, ensureDb } from "./db";
import { DEFAULT_TESTIMONIALS } from "./defaults";

export type TestimonialStatus = "pending" | "approved" | "declined";

export type Testimonial = {
  id: number;
  createdAt: string;
  name: string;
  quote: string;
  rating: number;
  status: TestimonialStatus;
};

export type NewTestimonial = {
  name: string;
  quote: string;
  rating: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTestimonial(r: any): Testimonial {
  return {
    id: r.id,
    createdAt:
      typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    name: r.name,
    quote: r.quote,
    rating: r.rating,
    status: r.status,
  };
}

export async function createTestimonial(t: NewTestimonial): Promise<Testimonial | null> {
  if (!sql) return null;
  await ensureDb();
  const rating = Math.max(1, Math.min(5, Math.round(t.rating) || 5));
  const rows = await sql`INSERT INTO testimonials (name, quote, rating, status)
    VALUES (${t.name}, ${t.quote}, ${rating}, 'pending') RETURNING *`;
  return mapTestimonial(rows[0]);
}

// All testimonials, newest first (admin moderation view).
export async function listTestimonials(): Promise<Testimonial[]> {
  if (!sql) return [];
  await ensureDb();
  const rows = await sql`SELECT * FROM testimonials ORDER BY created_at DESC`;
  return rows.map(mapTestimonial);
}

// Only approved testimonials for public display.
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  if (!sql) {
    return DEFAULT_TESTIMONIALS.map((t, i) => ({
      id: i + 1,
      createdAt: "",
      name: t.name,
      quote: t.quote,
      rating: t.rating,
      status: "approved" as const,
    }));
  }
  await ensureDb();
  const rows = await sql`SELECT * FROM testimonials WHERE status = 'approved'
    ORDER BY created_at DESC`;
  return rows.map(mapTestimonial);
}

export async function setTestimonialStatus(
  id: number,
  status: TestimonialStatus
): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`UPDATE testimonials SET status = ${status} WHERE id = ${id}`;
}

export async function deleteTestimonial(id: number): Promise<void> {
  if (!sql) throw new Error("Database not configured");
  await ensureDb();
  await sql`DELETE FROM testimonials WHERE id = ${id}`;
}
