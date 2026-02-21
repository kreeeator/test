import { google } from "googleapis";
import { prisma } from "./prisma";
import { env } from "./env";

const INVENTORY_SHEET = "Наличие";
const SALES_SHEET = "Продажи";
const TOTALS_SHEET = "Итого";

async function getAuthClient() {
  if (!env.googleClientEmail || !env.googlePrivateKey) return null;
  return new google.auth.JWT({
    email: env.googleClientEmail,
    key: env.googlePrivateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

export async function syncSheetsToDb() {
  const auth = await getAuthClient();
  if (!auth || !env.googleSheetId) return;
  const sheets = google.sheets({ version: "v4", auth });

  const [inventoryRes, salesRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: env.googleSheetId, range: `${INVENTORY_SHEET}!A1:Z` }),
    sheets.spreadsheets.values.get({ spreadsheetId: env.googleSheetId, range: `${SALES_SHEET}!A1:Z` })
  ]);

  const inventoryRows = inventoryRes.data.values ?? [];
  const salesRows = salesRes.data.values ?? [];
  await upsertInventory(inventoryRows);
  await upsertSales(salesRows);

  await prisma.syncLog.create({ data: { source: "google_sheets", status: "success" } });
}

function mapByHeader(rows: string[][]) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
    return obj;
  });
}

async function upsertInventory(rows: string[][]) {
  const mapped = mapByHeader(rows);
  for (const r of mapped) {
    if (!r.sku) continue;
    await prisma.inventoryItem.upsert({
      where: { sku: r.sku },
      create: {
        sku: r.sku,
        itemId: r.id || r.itemid || r["id товара"] || r.sku,
        title: r.name || r.title || "Без названия",
        model: r.model || "",
        color: r.color || "",
        size: r.size || "",
        stock: Number(r.stock || r.qty || 0),
        purchasePrice: Number(r.purchase || r["закуп"] || 0)
      },
      update: {
        stock: Number(r.stock || r.qty || 0),
        purchasePrice: Number(r.purchase || r["закуп"] || 0),
        model: r.model || "",
        color: r.color || "",
        size: r.size || ""
      }
    });
  }
}

async function upsertSales(rows: string[][]) {
  const mapped = mapByHeader(rows);
  for (const r of mapped) {
    if (!r.sku || !r.date) continue;
    const uniqueKey = `${r.date}-${r.sku}-${r.sum || r.amount || "0"}-${r.platform || "other"}`;
    await prisma.sale.upsert({
      where: { externalKey: uniqueKey },
      create: {
        externalKey: uniqueKey,
        soldAt: new Date(r.date),
        sku: r.sku,
        itemId: r.id || r.itemid || r.sku,
        title: r.name || r.title || "Без названия",
        quantity: Number(r.qty || r.quantity || 1),
        amount: Number(r.sum || r.amount || 0),
        commission: Number(r.commission || 0),
        purchasePrice: Number(r.purchase || r["закуп"] || 0),
        channel: normalizeChannel(r.platform || r.channel || "other")
      },
      update: {}
    });
  }
}

function normalizeChannel(v: string) {
  const value = v.toLowerCase();
  if (value.includes("авито") || value.includes("avito")) return "avito";
  if (value.includes("лич")) return "direct";
  return "other";
}

export async function appendSaleToSheet(values: (string | number)[]) {
  const auth = await getAuthClient();
  if (!auth || !env.googleSheetId) return;
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: env.googleSheetId,
    range: `${SALES_SHEET}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] }
  });
}

export async function updateInventorySheetCell(sku: string, stock: number) {
  const auth = await getAuthClient();
  if (!auth || !env.googleSheetId) return;
  const sheets = google.sheets({ version: "v4", auth });
  const rows = await sheets.spreadsheets.values.get({ spreadsheetId: env.googleSheetId, range: `${INVENTORY_SHEET}!A1:Z` });
  const values = rows.data.values ?? [];
  const header = values[0]?.map((v) => v.toLowerCase()) ?? [];
  const skuCol = header.findIndex((h) => h === "sku");
  const stockCol = header.findIndex((h) => h === "stock" || h === "qty");
  if (skuCol === -1 || stockCol === -1) return;
  const rowIdx = values.findIndex((row, idx) => idx > 0 && row[skuCol] === sku);
  if (rowIdx === -1) return;
  const colLetter = String.fromCharCode(65 + stockCol);
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.googleSheetId,
    range: `${INVENTORY_SHEET}!${colLetter}${rowIdx + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[stock]] }
  });
}

export async function readTotalsSheet() {
  const auth = await getAuthClient();
  if (!auth || !env.googleSheetId) return [];
  const sheets = google.sheets({ version: "v4", auth });
  const totals = await sheets.spreadsheets.values.get({ spreadsheetId: env.googleSheetId, range: `${TOTALS_SHEET}!A1:Z` });
  return totals.data.values ?? [];
}
