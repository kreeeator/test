import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { env } from "./env";

const SESSION_COOKIE = "session";
const FINANCE_COOKIE = "hide_finance";

export async function validateCredentials(login: string, password: string) {
  if (login !== env.adminLogin) return false;
  return bcrypt.compare(password, env.adminPasswordHash);
}

export function createSessionValue() {
  return crypto.createHmac("sha256", env.sessionSecret).update(`${Date.now()}:${env.adminLogin}`).digest("hex");
}

export function setSessionCookie(session: string) {
  cookies().set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export function isFinanceHidden() {
  return cookies().get(FINANCE_COOKIE)?.value !== "0";
}

export function setFinanceHidden(hidden: boolean) {
  cookies().set(FINANCE_COOKIE, hidden ? "1" : "0", { httpOnly: true, sameSite: "lax", path: "/" });
}
