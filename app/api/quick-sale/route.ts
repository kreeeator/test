import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendSaleToSheet, updateInventorySheetCell } from "@/lib/sheets";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const idemKey = req.headers.get("x-idempotency-key");
  if (!idemKey) return NextResponse.json({ error: "Missing idempotency key" }, { status: 400 });
  const existing = await prisma.idempotencyKey.findUnique({ where: { key: idemKey } });
  if (existing) return NextResponse.json({ ok: true, deduplicated: true });

  const body = await req.json();
  const { sku, quantity, channel, amount, commission } = body;
  if (!sku || !quantity || !channel || amount == null || commission == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (quantity <= 0 || amount < 0 || commission < 0) {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findUnique({ where: { sku } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.stock < quantity) return NextResponse.json({ error: "Not enough stock" }, { status: 400 });

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        externalKey: `manual-${crypto.randomUUID()}`,
        soldAt: new Date(),
        sku,
        itemId: item.itemId,
        title: item.title,
        quantity,
        amount,
        commission,
        purchasePrice: item.purchasePrice,
        channel
      }
    });
    await tx.inventoryItem.update({ where: { sku }, data: { stock: { decrement: quantity } } });
    await tx.idempotencyKey.create({ data: { key: idemKey } });
    return created;
  });

  await appendSaleToSheet([sale.soldAt.toISOString(), sku, item.itemId, item.title, quantity, channel, amount, commission, item.purchasePrice]);
  await updateInventorySheetCell(sku, item.stock - quantity);

  return NextResponse.json({ ok: true, saleId: sale.id });
}
