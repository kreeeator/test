"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const login = String(formData.get("login") || "");
    const password = String(formData.get("password") || "");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="card">
        <h1>KR STORE Login</h1>
        <form onSubmit={onSubmit} className="grid">
          <input name="login" placeholder="Логин" required />
          <input name="password" type="password" placeholder="Пароль" required />
          <button type="submit">Войти</button>
          {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
