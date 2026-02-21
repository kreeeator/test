const attempts = new Map<string, { count: number; blockedUntil: number }>();

export function consumeLoginAttempt(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip) ?? { count: 0, blockedUntil: 0 };
  if (entry.blockedUntil > now) {
    return { ok: false, retryAfterMs: entry.blockedUntil - now };
  }
  entry.count += 1;
  if (entry.count >= 5) {
    entry.blockedUntil = now + 5 * 60_000;
    entry.count = 0;
  }
  attempts.set(ip, entry);
  return { ok: true, retryAfterMs: 0 };
}

export function resetLoginAttempts(ip: string) {
  attempts.delete(ip);
}
