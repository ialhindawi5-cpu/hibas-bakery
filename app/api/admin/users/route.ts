import { NextResponse } from "next/server";
import { listAdminUsers, createAdminUser } from "@/app/lib/users";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await listAdminUsers());
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const username = String(b.username || "").trim();
    const password = String(b.password || "");
    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const user = await createAdminUser(username, password);
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create user" },
      { status: 400 }
    );
  }
}
