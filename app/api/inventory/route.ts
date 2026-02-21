import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRecentSync } from "@/lib/sync";

const LOW_STOCK_THRESHOLD = 3;
const DEAD_STOCK_DAYS = 30;
const TOP_SALES_N = 10;

export async function GET(req: NextRequest) {
  await ensureRecentSync();
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const model = req.nextUrl.searchParams.get("model") ?? "";
  const color = req.nextUrl.searchParams.get("color") ?? "";
  const size = req.nextUrl.searchParams.get("size") ?? "";
  const sort = req.nextUrl.searchParams.get("sort") ?? "stock_desc";

  const items = await prisma.inventoryItem.findMany({
    where: {
      sku: { contains: q, mode: "insensitive" },
      model: { contains: model, mode: "insensitive" },
      color: { contains: color, mode: "insensitive" },
      size: { contains: size, mode: "insensitive" }
    }
  });

  const sales = await prisma.sale.findMany();
  const now = Date.now();
  const profitBySku = sales.reduce((acc: Record<string, number>, s) => {
    acc[s.sku] = (acc[s.sku] ?? 0) + (s.amount - s.commission - s.purchasePrice * s.quantity);
    return acc;
  }, {});
  const turnoverBySku = sales.reduce((acc: Record<string, number>, s) => {
    acc[s.sku] = (acc[s.sku] ?? 0) + s.amount;
    return acc;
  }, {});
  const lastSoldBySku = sales.reduce((acc: Record<string, number>, s) => {
    const ts = s.soldAt.getTime();
    acc[s.sku] = Math.max(acc[s.sku] ?? 0, ts);
    return acc;
  }, {});

  const topSkus = new Set(Object.entries(profitBySku).sort((a, b) => b[1] - a[1]).slice(0, TOP_SALES_N).map(([sku]) => sku));

  let enriched = items.map((item) => {
    const tags: string[] = [];
    if (item.stock <= LOW_STOCK_THRESHOLD) tags.push("low_stock");
    const last = lastSoldBySku[item.sku] ?? 0;
    if (!last || now - last > DEAD_STOCK_DAYS * 86400_000) tags.push("dead_stock");
    if (topSkus.has(item.sku)) tags.push("top_sales");
    return { ...item, profit: profitBySku[item.sku] ?? 0, turnover: turnoverBySku[item.sku] ?? 0, tags };
  });

  if (sort === "profit_desc") enriched = enriched.sort((a, b) => b.profit - a.profit);
  else if (sort === "turnover_desc") enriched = enriched.sort((a, b) => b.turnover - a.turnover);
  else enriched = enriched.sort((a, b) => b.stock - a.stock);

  return NextResponse.json({ items: enriched });
}
