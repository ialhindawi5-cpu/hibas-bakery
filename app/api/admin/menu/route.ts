import { NextResponse } from "next/server";
import { getMenu, addMenuItem } from "@/app/lib/content";

export const runtime = "nodejs";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

export async function GET() {
  return NextResponse.json(await getMenu());
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const name = String(b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const existing = await getMenu();
    const maxOrder = existing.reduce((m, i) => Math.max(m, i.sortOrder), 0);

    const item = await addMenuItem({
      slug: b.slug ? slugify(String(b.slug)) : slugify(name),
      name,
      description: String(b.description || ""),
      image: b.image ? String(b.image) : null,
      emoji: String(b.emoji || "🍰"),
      sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : maxOrder + 1,
      active: b.active !== false,
      featured: Boolean(b.featured),
    });
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add item" },
      { status: 500 }
    );
  }
}
