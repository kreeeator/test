import { TopNav } from "@/components/TopNav";
import { cookies } from "next/headers";

export default async function InventoryPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const q = searchParams.q ?? "";
  const model = searchParams.model ?? "";
  const color = searchParams.color ?? "";
  const size = searchParams.size ?? "";
  const sort = searchParams.sort ?? "stock_desc";

  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/inventory`);
  Object.entries({ q, model, color, size, sort }).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  const hide = cookies().get("hide_finance")?.value !== "0";

  return (
    <div className="container">
      <TopNav hideFinanceDefault={hide} />
      <form className="toolbar" method="GET">
        <input name="q" placeholder="SKU/ID/Название" defaultValue={q} />
        <input name="model" placeholder="Модель" defaultValue={model} />
        <input name="color" placeholder="Цвет" defaultValue={color} />
        <input name="size" placeholder="Размер" defaultValue={size} />
        <select name="sort" defaultValue={sort}>
          <option value="stock_desc">Остаток ↓</option>
          <option value="profit_desc">Прибыль ↓</option>
          <option value="turnover_desc">Оборот ↓</option>
        </select>
        <button type="submit">Применить</button>
      </form>
      <div className="card">
        <table>
          <thead><tr><th>SKU</th><th>Товар</th><th>Остаток</th><th>Прибыль</th><th>Оборот</th><th>Теги</th></tr></thead>
          <tbody>
            {data.items.length === 0 ? <tr><td colSpan={6}>Нет данных</td></tr> : data.items.map((item: any) => (
              <tr key={item.sku}>
                <td>{item.sku}</td>
                <td>{item.title}</td>
                <td>{item.stock}</td>
                <td className={hide ? "blurred" : ""}>{item.profit.toFixed(2)}</td>
                <td className={hide ? "blurred" : ""}>{item.turnover.toFixed(2)}</td>
                <td>
                  {item.tags.includes("low_stock") ? <span className="badge warn">мало осталось</span> : null}
                  {item.tags.includes("dead_stock") ? <span className="badge info">мёртвый груз</span> : null}
                  {item.tags.includes("top_sales") ? <span className="badge ok">топ</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
