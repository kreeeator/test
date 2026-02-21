"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function TopNav({ hideFinanceDefault }: { hideFinanceDefault: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hideFinance, setHideFinance] = useState(hideFinanceDefault);

  const onToggle = async () => {
    const next = !hideFinance;
    setHideFinance(next);
    await fetch("/api/toggle-finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hideFinance: next })
    });
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const linkStyle = (path: string) => ({
    padding: "6px 10px",
    borderRadius: 8,
    background: pathname.startsWith(path) ? "#111827" : "#fff",
    color: pathname.startsWith(path) ? "#fff" : "#111"
  });

  return (
    <div className="header">
      <div className="nav">
        <Link href="/dashboard" style={linkStyle("/dashboard")}>Dashboard</Link>
        <Link href="/inventory" style={linkStyle("/inventory")}>Наличие</Link>
        <Link href="/sales" style={linkStyle("/sales")}>Продажи</Link>
      </div>
      <div className="nav">
        <button onClick={onToggle}>{hideFinance ? "Показать финансы" : "Скрыть финансы"}</button>
        <button onClick={logout}>Выйти</button>
      </div>
    </div>
  );
}
