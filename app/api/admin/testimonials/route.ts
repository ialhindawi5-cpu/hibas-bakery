import { NextResponse } from "next/server";
import { listTestimonials } from "@/app/lib/testimonials";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await listTestimonials());
}
