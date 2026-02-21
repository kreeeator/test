import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcMetrics, periodRange } from "@/lib/formulas";
import { ensureRecentSync } from "@/lib/sync";

export async function GET(req: NextRequest) {
  await ensureRecentSync();
  const period = (req.nextUrl.searchParams.get("period") as "today" | "week" | "month") ?? "today";
  const { start, end } = periodRange(period);

  const [sales, inventory] = await Promise.all([
    prisma.sale.findMany({ where: { soldAt: { gte: start, lte: end } } }),
    prisma.inventoryItem.findMany()
  ]);

  const metrics = calcMetrics(sales as any, inventory as any);
  const incomeByDay = Object.values(sales.reduce((acc: Record<string, number>, s) => {
    const d = s.soldAt.toISOString().slice(0, 10);
    acc[d] = (acc[d] ?? 0) + (s.amount - s.commission - s.purchasePrice * s.quantity);
    return acc;
  }, {})).length ? sales.reduce((acc: Record<string, number>, s) => {
    const d = s.soldAt.toISOString().slice(0, 10);
    acc[d] = (acc[d] ?? 0) + (s.amount - s.commission - s.purchasePrice * s.quantity);
    return acc;
  }, {}) : {};

  const channels = sales.reduce((acc: Record<string, number>, s) => {
    acc[s.channel] = (acc[s.channel] ?? 0) + s.quantity;
    return acc;
  }, {});

  const topProducts = Object.entries(sales.reduce((acc: Record<string, number>, s) => {
    acc[s.sku] = (acc[s.sku] ?? 0) + (s.amount - s.commission - s.purchasePrice * s.quantity);
    return acc;
  }, {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sku, profit]) => ({ sku, profit }));

  return NextResponse.json({ metrics, charts: { incomeByDay, channels, topProducts } });
}
