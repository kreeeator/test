import { TopNav } from "@/components/TopNav";
import { cookies } from "next/headers";

export default async function SalesPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/sales`);
  Object.entries(searchParams).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  const hide = cookies().get("hide_finance")?.value !== "0";

  return (
    <div className="container">
      <TopNav hideFinanceDefault={hide} />
      <form className="toolbar" method="GET">
        <input type="date" name="dateFrom" defaultValue={searchParams.dateFrom} />
        <input type="date" name="dateTo" defaultValue={searchParams.dateTo} />
        <select name="channel" defaultValue={searchParams.channel ?? ""}>
          <option value="">Все площадки</option>
          <option value="avito">Авито</option>
          <option value="direct">Личка</option>
          <option value="other">Другое</option>
        </select>
        <input name="q" placeholder="SKU/ID" defaultValue={searchParams.q} />
        <button type="submit">Фильтр</button>
      </form>
      <div className="card" style={{ marginBottom: 12 }}>
        <b>Заказов:</b> {data.summary.orders} | <b>Штук:</b> {data.summary.qty} | <b>Доход:</b> <span className={hide ? "blurred" : ""}>{data.summary.netIncome.toFixed(2)}</span>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Дата</th><th>SKU</th><th>Площадка</th><th>Кол-во</th><th>Сумма</th><th>Комиссия</th></tr></thead>
          <tbody>
            {data.items.length === 0 ? <tr><td colSpan={6}>Нет данных</td></tr> : data.items.map((s: any) => (
              <tr key={s.id}><td>{new Date(s.soldAt).toLocaleDateString()}</td><td>{s.sku}</td><td>{s.channel}</td><td>{s.quantity}</td><td className={hide ? "blurred" : ""}>{s.amount.toFixed(2)}</td><td className={hide ? "blurred" : ""}>{s.commission.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
