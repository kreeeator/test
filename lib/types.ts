export type SaleRecord = {
  id: string;
  date: string;
  sku: string;
  itemId: string;
  title: string;
  quantity: number;
  amount: number;
  commission: number;
  purchasePrice: number;
  channel: "avito" | "direct" | "other";
};

export type InventoryItem = {
  sku: string;
  itemId: string;
  title: string;
  model: string;
  color: string;
  size: string;
  stock: number;
  purchasePrice: number;
};
