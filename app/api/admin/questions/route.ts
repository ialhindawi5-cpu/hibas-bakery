import { NextResponse } from "next/server";
import { getQuestions, addQuestion } from "@/app/lib/content";
import type { QuestionType, QuestionRole } from "@/app/lib/types";

export const runtime = "nodejs";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "question"
  );
}

export async function GET() {
  return NextResponse.json(await getQuestions());
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const label = String(b.label || "").trim();
    if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 });

    const existing = await getQuestions();
    const maxOrder = existing.reduce((m, q) => Math.max(m, q.sortOrder), 0);
    const base = b.qkey ? slugify(String(b.qkey)) : slugify(label);
    let qkey = base;
    let n = 2;
    while (existing.some((q) => q.qkey === qkey)) qkey = `${base}_${n++}`;

    const q = await addQuestion({
      qkey,
      label,
      type: (b.type as QuestionType) || "text",
      options: Array.isArray(b.options) ? b.options.map(String) : [],
      required: Boolean(b.required),
      role: (b.role as QuestionRole) || "none",
      sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : maxOrder + 1,
      active: b.active !== false,
    });
    return NextResponse.json(q);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add question" },
      { status: 500 }
    );
  }
}
