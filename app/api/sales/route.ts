import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRecentSync } from "@/lib/sync";

export async function GET(req: NextRequest) {
  await ensureRecentSync();
  const dateFrom = req.nextUrl.searchParams.get("dateFrom");
  const dateTo = req.nextUrl.searchParams.get("dateTo");
  const channel = req.nextUrl.searchParams.get("channel");
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const where: any = {
    AND: [
      q ? { OR: [{ sku: { contains: q, mode: "insensitive" } }, { itemId: { contains: q, mode: "insensitive" } }] } : {},
      channel ? { channel } : {},
      dateFrom ? { soldAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { soldAt: { lte: new Date(`${dateTo}T23:59:59`) } } : {}
    ]
  };

  const items = await prisma.sale.findMany({ where, orderBy: { soldAt: "desc" }, take: 500 });
  const summary = {
    orders: items.length,
    qty: items.reduce((s, i) => s + i.quantity, 0),
    netIncome: items.reduce((s, i) => s + (i.amount - i.commission - i.purchasePrice * i.quantity), 0)
  };

  return NextResponse.json({ items, summary });
}
