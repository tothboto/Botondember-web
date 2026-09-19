/** Admin műveletek naplója – az Irányítópult „utolsó módosítások” listájához. */
import { desc, lt } from "drizzle-orm";
import type { Db } from "@/db/client";
import { auditLog } from "@/db/schema";

const KEEP = 300;

export async function logActivity(db: Db, area: string, message: string): Promise<void> {
  await db.insert(auditLog).values({ createdAt: Date.now(), area, message: message.slice(0, 300) });
  // Csak a legutóbbi bejegyzéseket őrizzük meg.
  const cutoff = await db.select({ id: auditLog.id }).from(auditLog).orderBy(desc(auditLog.id)).limit(1).offset(KEEP);
  if (cutoff[0]) await db.delete(auditLog).where(lt(auditLog.id, cutoff[0].id));
}

export async function recentActivity(db: Db, limit = 10) {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(limit);
}
