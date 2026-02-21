import { NextRequest, NextResponse } from "next/server";
import { setFinanceHidden } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  setFinanceHidden(Boolean(body.hideFinance));
  return NextResponse.json({ ok: true });
}
