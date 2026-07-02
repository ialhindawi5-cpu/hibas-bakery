import { NextResponse } from "next/server";
import {
  setTestimonialStatus,
  deleteTestimonial,
  type TestimonialStatus,
} from "@/app/lib/testimonials";

export const runtime = "nodejs";

const VALID: TestimonialStatus[] = ["pending", "approved", "declined"];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const b = await req.json();
    const status = String(b.status) as TestimonialStatus;
    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await setTestimonialStatus(Number(id), status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteTestimonial(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 }
    );
  }
}
