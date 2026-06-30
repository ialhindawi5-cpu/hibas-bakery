import { NextResponse } from "next/server";
import { createMessage } from "@/app/lib/messages";
import { getSettings } from "@/app/lib/content";
import { sendContactEmail } from "@/app/lib/email";
import { rateLimit, clientIp } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rl = await rateLimit(`contact:${clientIp(req)}`, 6, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You've sent several messages already. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!message)
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  if (message.length > 5000)
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  const data = { name, email, phone, message };

  let saved = false;
  try {
    saved = Boolean(await createMessage(data));
  } catch (e) {
    console.error("Failed to save message:", e);
  }

  let emailed = false;
  try {
    const settings = await getSettings();
    const r = await sendContactEmail(data, settings.orderEmail, settings.siteName);
    emailed = r.sent;
  } catch (e) {
    console.error("Failed to send contact email:", e);
  }

  if (!saved && !emailed) {
    return NextResponse.json(
      { error: "Sorry, we couldn't send your message. Please call or email us instead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
