import { NextRequest, NextResponse } from "next/server";
import { consumeLoginAttempt, resetLoginAttempts } from "@/lib/rate-limit";
import { createSessionValue, setSessionCookie, validateCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "local";
  const limit = consumeLoginAttempt(ip);
  if (!limit.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json();
  const valid = await validateCredentials(body.login, body.password);
  if (!valid) return NextResponse.json({ error: "Неверные данные" }, { status: 401 });

  resetLoginAttempts(ip);
  const session = createSessionValue();
  setSessionCookie(session);
  return NextResponse.json({ ok: true });
}
