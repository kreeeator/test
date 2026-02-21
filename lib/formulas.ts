import { SaleRecord, InventoryItem } from "./types";

export function calcMetrics(sales: SaleRecord[], inventory: InventoryItem[]) {
  const revenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const commissions = sales.reduce((sum, s) => sum + s.commission, 0);
  const cogs = sales.reduce((sum, s) => sum + s.purchasePrice * s.quantity, 0);
  const netIncome = revenue - commissions - cogs;
  const qtySold = sales.reduce((sum, s) => sum + s.quantity, 0);
  const avgCheck = sales.length ? revenue / sales.length : 0;
  const margin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
  const stockMoney = inventory.reduce((sum, item) => sum + item.stock * item.purchasePrice, 0);
  return { revenue, commissions, netIncome, qtySold, avgCheck, margin, stockMoney };
}

export function periodRange(period: "today" | "week" | "month") {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(now.getDate() - 6);
  if (period === "month") start.setDate(now.getDate() - 29);
  return { start, end: now };
}
