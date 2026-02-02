import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import * as s from "../../shared/schema";

export async function isPeriodLocked(companyId: string, transactionDate: Date): Promise<boolean> {
  const [lock] = await db
    .select()
    .from(s.accountingPeriodLocks)
    .innerJoin(s.accountingPeriods, eq(s.accountingPeriodLocks.periodId, s.accountingPeriods.id))
    .where(
      and(
        eq(s.accountingPeriodLocks.companyId, companyId),
        sql`${transactionDate}::date >= ${s.accountingPeriods.startDate}::date AND ${transactionDate}::date <= ${s.accountingPeriods.endDate}::date`
      )
    )
    .limit(1);
  return !!lock;
}

export async function lockAccountingPeriod(
  companyId: string,
  periodId: string,
  actorUserId: string,
  reason: string
): Promise<void> {
  await db.transaction(async (tx: any) => {
    const existingPeriod = await tx
      .select()
      .from(s.accountingPeriods)
      .where(eq(s.accountingPeriods.id, periodId))
      .limit(1);
    
    await tx.insert(s.accountingPeriodLocks).values({
      companyId,
      periodId,
      action: "LOCK",
      reason,
      actorUserId,
      createdAt: new Date(),
    });
    await tx
      .update(s.accountingPeriods)
      .set({ startDate: existingPeriod[0].startDate, endDate: existingPeriod[0].endDate })
      .where(eq(s.accountingPeriods.id, periodId));
  });
}

export async function unlockAccountingPeriod(
  companyId: string,
  periodId: string,
  actorUserId: string,
  reason: string
): Promise<void> {
  await db.transaction(async (tx: any) => {
    const existingPeriod = await tx
      .select()
      .from(s.accountingPeriods)
      .where(eq(s.accountingPeriods.id, periodId))
      .limit(1);
    
    await tx
      .delete(s.accountingPeriodLocks)
      .where(and(eq(s.accountingPeriodLocks.companyId, companyId), eq(s.accountingPeriodLocks.periodId, periodId)));
    await tx
      .update(s.accountingPeriods)
      .set({ startDate: existingPeriod[0].startDate, endDate: existingPeriod[0].endDate })
      .where(eq(s.accountingPeriods.id, periodId));
  });
}

export async function getAccountingPeriods(companyId: string): Promise<typeof s.accountingPeriods.$inferSelect[]> {
  return await db
    .select({
      id: s.accountingPeriods.id,
      companyId: s.accountingPeriods.companyId,
      startDate: s.accountingPeriods.startDate,
      endDate: s.accountingPeriods.endDate,
      createdAt: s.accountingPeriods.createdAt,
      isLocked: sql<boolean>`EXISTS (
        SELECT 1 FROM ${s.accountingPeriodLocks}
        WHERE ${s.accountingPeriodLocks.periodId} = ${s.accountingPeriods.id}
        AND ${s.accountingPeriodLocks.companyId} = ${companyId}
      )`.as("isLocked"),
    })
    .from(s.accountingPeriods)
    .where(eq(s.accountingPeriods.companyId, companyId))
    .orderBy(s.accountingPeriods.startDate);
}
