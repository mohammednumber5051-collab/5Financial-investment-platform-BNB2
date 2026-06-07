import { Router, type IRouter } from "express";
import { db, notificationsTable, beneficiariesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/beneficiaries/:id/notifications", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.beneficiaryId, id))
      .orderBy(notificationsTable.createdAt);
    res.json(rows.reverse());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل الإشعارات" });
  }
});

router.put("/notifications/:id/read", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "الإشعار غير موجود" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحديث الإشعار" });
  }
});

router.put("/notifications/read-all/:beneficiaryId", async (req, res): Promise<void> => {
  try {
    const beneficiaryId = Number(req.params.beneficiaryId);
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.beneficiaryId, beneficiaryId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحديث الإشعارات" });
  }
});

router.post("/beneficiaries/:id/add-profits", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body as { amount: number };
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const currentProfits = parseInt(current.profits.replace(/,/g, ""), 10) || 0;
    const newProfits = currentProfits + amount;
    const formatted = newProfits.toLocaleString("en-US");

    const [updated] = await db
      .update(beneficiariesTable)
      .set({ profits: formatted })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    const message = `تم إضافة أرباح جديدة إلى حسابكم\n\nقيمة الأرباح المضافة:\n${amount.toLocaleString("en-US")} ر.س\n\nإجمالي الأرباح الحالي:\n${formatted} ر.س`;
    await db.insert(notificationsTable).values({
      beneficiaryId: id,
      type: "profits_added",
      title: "إضافة أرباح جديدة",
      message,
      isRead: false,
    });

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إضافة الأرباح" });
  }
});

router.post("/beneficiaries/:id/add-fees", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body as { amount: number };
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const currentFees = parseInt(current.fees.replace(/,/g, ""), 10) || 0;
    const newFees = currentFees + amount;
    const formatted = newFees.toLocaleString("en-US");

    const [updated] = await db
      .update(beneficiariesTable)
      .set({ fees: formatted, withdrawalFeeStatus: "unpaid" })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إضافة الرسوم" });
  }
});

router.post("/beneficiaries/:id/pay-fees", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const [updated] = await db
      .update(beneficiariesTable)
      .set({ fees: "0", withdrawalFeeStatus: "paid" })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    const message = "تم سداد رسوم السحب الخاصة بحسابكم.\n\nسيتم تحرير الحساب وتفعيل السحب خلال 24 ساعة.";
    await db.insert(notificationsTable).values({
      beneficiaryId: id,
      type: "fees_paid",
      title: "تم سداد رسوم السحب",
      message,
      isRead: false,
    });

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل سداد الرسوم" });
  }
});

export default router;
