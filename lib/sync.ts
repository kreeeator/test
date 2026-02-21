import { prisma } from "./prisma";
import { syncSheetsToDb } from "./sheets";

const SYNC_TTL_MS = 5 * 60_000;

export async function ensureRecentSync() {
  const last = await prisma.syncLog.findFirst({ where: { source: "google_sheets", status: "success" }, orderBy: { createdAt: "desc" } });
  if (!last || Date.now() - last.createdAt.getTime() > SYNC_TTL_MS) {
    await syncSheetsToDb();
  }
}
