import { cookies } from "next/headers";
import { TopNav } from "@/components/TopNav";

export default async function DashboardPage({ searchParams }: { searchParams: { period?: "today" | "week" | "month" } }) {
  const period = searchParams.period ?? "today";
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/dashboard?period=${period}`, { cache: "no-store" });
  const data = await res.json();
  const hide = cookies().get("hide_finance")?.value !== "0";

  const financeClass = hide ? "blurred" : "";

  return (
    <div className="container">
      <TopNav hideFinanceDefault={hide} />
      <div className="toolbar">
        <a href="/dashboard?period=today">Сегодня</a>
        <a href="/dashboard?period=week">Неделя</a>
        <a href="/dashboard?period=month">Месяц</a>
      </div>
      <div className="grid grid-3">
        <div className="card"><h4>Выручка</h4><div className={financeClass}>{data.metrics.revenue.toFixed(2)}</div></div>
        <div className="card"><h4>Чистый доход</h4><div className={financeClass}>{data.metrics.netIncome.toFixed(2)}</div></div>
        <div className="card"><h4>Комиссии</h4><div className={financeClass}>{data.metrics.commissions.toFixed(2)}</div></div>
        <div className="card"><h4>Маржа %</h4><div>{data.metrics.margin.toFixed(2)}</div></div>
        <div className="card"><h4>Продано штук</h4><div>{data.metrics.qtySold}</div></div>
        <div className="card"><h4>Средний чек</h4><div className={financeClass}>{data.metrics.avgCheck.toFixed(2)}</div></div>
        <div className="card"><h4>Деньги в складе</h4><div className={financeClass}>{data.metrics.stockMoney.toFixed(2)}</div></div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card"><h3>Доход по дням</h3><pre>{JSON.stringify(data.charts.incomeByDay, null, 2)}</pre></div>
        <div className="card"><h3>Площадки</h3><pre>{JSON.stringify(data.charts.channels, null, 2)}</pre></div>
        <div className="card"><h3>Топ товары по прибыли</h3><pre>{JSON.stringify(data.charts.topProducts, null, 2)}</pre></div>
      </div>
    </div>
  );
}
