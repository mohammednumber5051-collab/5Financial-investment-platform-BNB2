import { Router, type IRouter } from "express";
import { db, notificationsTable, beneficiariesTable, financialTransactionsTable, userCustomPhasesTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";

const router: IRouter = Router();

async function logTransaction(
  beneficiaryId: number,
  type: string,
  amount: string,
  description: string,
) {
  await db.insert(financialTransactionsTable).values({
    beneficiaryId,
    type,
    amount,
    description,
  });
}

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

router.get("/beneficiaries/:id/transactions", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const rows = await db
      .select()
      .from(financialTransactionsTable)
      .where(eq(financialTransactionsTable.beneficiaryId, id))
      .orderBy(financialTransactionsTable.createdAt);
    res.json(rows.reverse());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل سجل العمليات" });
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

    await logTransaction(id, "add_profits", String(amount), `إضافة أرباح: ${amount.toLocaleString("en-US")} ر.س`);

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

    await logTransaction(id, "add_fees", String(amount), `إضافة رسوم سحب: ${amount.toLocaleString("en-US")} ر.س`);

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

    const paidAt = new Date();
    const [updated] = await db
      .update(beneficiariesTable)
      .set({ fees: "0", withdrawalFeeStatus: "paid", withdrawalFeePaidAt: paidAt })
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

    await logTransaction(id, "pay_withdrawal_fees", current.fees, `تأكيد سداد رسوم السحب: ${current.fees} ر.س`);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل سداد الرسوم" });
  }
});

router.post("/beneficiaries/:id/add-liberation-fee", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body as { amount: number };
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const formatted = Number(amount).toLocaleString("en-US");
    const [updated] = await db
      .update(beneficiariesTable)
      .set({ liberationFee: formatted, liberationFeeStatus: "unpaid" })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    await logTransaction(id, "add_liberation_fee", String(amount), `إضافة رسوم تحرير الأرباح: ${formatted} ر.س`);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إضافة رسوم التحرير" });
  }
});

router.post("/beneficiaries/:id/pay-liberation-fee", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const paidAt = new Date();
    const [updated] = await db
      .update(beneficiariesTable)
      .set({ liberationFeeStatus: "paid", liberationFeePaidAt: paidAt, liberationFee: "0" })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    const message = `عزيز العميل / ${current.name} 🚨 تم تأكيد سداد رسوم تحرير الأرباح بنجاح ✅\n يرجى الإنتظار سوف يقوم النظام\n بتحرير  الأرباح  خلال أقل من 24 ساعة\nويتم تحرير أرباحك بنجاح ✅`;
    await db.insert(notificationsTable).values({
      beneficiaryId: id,
      type: "liberation_fee_paid",
      title: "تم تأكيد سداد رسوم تحرير الأرباح",
      message,
      isRead: false,
    });

    await logTransaction(id, "pay_liberation_fee", current.liberationFee, `تأكيد سداد رسوم تحرير الأرباح: ${current.liberationFee} ر.س`);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تأكيد سداد رسوم التحرير" });
  }
});

router.post("/beneficiaries/:id/add-transaction-fee", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body as { amount: number };
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const formatted = Number(amount).toLocaleString("en-US");
    const [updated] = await db
      .update(beneficiariesTable)
      .set({ transactionFee: formatted, transactionFeeStatus: "unpaid" })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    await logTransaction(id, "add_transaction_fee", String(amount), `إضافة مبلغ المعاملة: ${formatted} ر.س`);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إضافة مبلغ المعاملة" });
  }
});

router.post("/beneficiaries/:id/pay-transaction-fee", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [current] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const paidAt = new Date();
    const [updated] = await db
      .update(beneficiariesTable)
      .set({ transactionFeeStatus: "paid", transactionFeePaidAt: paidAt, transactionFee: "0" })
      .where(eq(beneficiariesTable.id, id))
      .returning();

    const message = `عزيز العميل / ${current.name} 🚨 تم تأكيد دفع معاملة تأكيد تحويل الأرباح بنجاح ✅\n يرجى الإنتظار سوف يقوم النظام\n بإتمام عملية سحب الأرباح  خلال أقل من 24 ساعة\nويتم سحب  أرباحك بنجاح ✅\nنشكر تفهمكم و تعاونكم معنا`;
    await db.insert(notificationsTable).values({
      beneficiaryId: id,
      type: "transaction_fee_paid",
      title: "تم تأكيد دفع مبلغ المعاملة",
      message,
      isRead: false,
    });

    await logTransaction(id, "pay_transaction_fee", current.transactionFee, `تأكيد سداد مبلغ المعاملة: ${current.transactionFee} ر.س`);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تأكيد سداد مبلغ المعاملة" });
  }
});

router.delete("/transactions/:id/undo", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const [tx] = await db
      .select()
      .from(financialTransactionsTable)
      .where(eq(financialTransactionsTable.id, id))
      .limit(1);

    if (!tx) { res.status(404).json({ error: "العملية غير موجودة" }); return; }

    const [current] = await db
      .select()
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.id, tx.beneficiaryId))
      .limit(1);

    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    type BeneficiaryUpdate = {
      profits?: string;
      fees?: string;
      withdrawalFeeStatus?: string;
      withdrawalFeePaidAt?: Date | null;
      liberationFee?: string;
      liberationFeeStatus?: string;
      liberationFeePaidAt?: Date | null;
      transactionFee?: string;
      transactionFeeStatus?: string;
      transactionFeePaidAt?: Date | null;
    };

    let updateData: BeneficiaryUpdate = {};

    switch (tx.type) {
      case "add_profits": {
        const amt = parseFloat(tx.amount) || 0;
        const cur = parseInt(current.profits.replace(/,/g, ""), 10) || 0;
        const next = Math.max(0, cur - amt);
        updateData = { profits: next.toLocaleString("en-US") };
        break;
      }
      case "add_fees": {
        const amt = parseFloat(tx.amount) || 0;
        const cur = parseInt(current.fees.replace(/,/g, ""), 10) || 0;
        const next = Math.max(0, cur - amt);
        updateData = { fees: next === 0 ? "0" : next.toLocaleString("en-US") };
        break;
      }
      case "pay_withdrawal_fees": {
        updateData = {
          withdrawalFeeStatus: "unpaid",
          withdrawalFeePaidAt: null,
          fees: tx.amount,
        };
        break;
      }
      case "add_liberation_fee": {
        updateData = { liberationFee: "0", liberationFeeStatus: "unpaid" };
        break;
      }
      case "pay_liberation_fee": {
        updateData = { liberationFeeStatus: "unpaid", liberationFeePaidAt: null };
        break;
      }
      case "add_transaction_fee": {
        updateData = { transactionFee: "0", transactionFeeStatus: "unpaid" };
        break;
      }
      case "pay_transaction_fee": {
        updateData = { transactionFeeStatus: "unpaid", transactionFeePaidAt: null };
        break;
      }
      default: {
        // custom phase: add_custom_phase_N or pay_custom_phase_N
        const addMatch = tx.type.match(/^add_custom_phase_(\d+)$/);
        const payMatch = tx.type.match(/^pay_custom_phase_(\d+)$/);
        if (addMatch) {
          const phaseId = Number(addMatch[1]);
          await db
            .update(userCustomPhasesTable)
            .set({ amount: "0", status: "unpaid" })
            .where(
              and(
                eq(userCustomPhasesTable.userId, tx.beneficiaryId),
                eq(userCustomPhasesTable.phaseId, phaseId),
              ),
            );
        } else if (payMatch) {
          const phaseId = Number(payMatch[1]);
          await db
            .update(userCustomPhasesTable)
            .set({ status: "unpaid", paidAt: null })
            .where(
              and(
                eq(userCustomPhasesTable.userId, tx.beneficiaryId),
                eq(userCustomPhasesTable.phaseId, phaseId),
              ),
            );
        }
        break;
      }
    }

    let updatedBeneficiary = current;
    if (Object.keys(updateData).length > 0) {
      const [updated] = await db
        .update(beneficiariesTable)
        .set(updateData)
        .where(eq(beneficiariesTable.id, tx.beneficiaryId))
        .returning();
      updatedBeneficiary = updated;
    }

    await db.delete(financialTransactionsTable).where(eq(financialTransactionsTable.id, id));

    const notifTypeMap: Record<string, string> = {
      add_profits: "profits_added",
      pay_withdrawal_fees: "fees_paid",
      pay_liberation_fee: "liberation_fee_paid",
      pay_transaction_fee: "transaction_fee_paid",
    };

    const notifType = notifTypeMap[tx.type];
    if (notifType) {
      const [latestNotif] = await db
        .select()
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.beneficiaryId, tx.beneficiaryId),
            eq(notificationsTable.type, notifType),
            eq(notificationsTable.isRead, false),
          ),
        )
        .orderBy(desc(notificationsTable.createdAt))
        .limit(1);

      if (latestNotif) {
        await db.delete(notificationsTable).where(eq(notificationsTable.id, latestNotif.id));
      }
    }

    res.json({ beneficiary: updatedBeneficiary });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل التراجع عن العملية" });
  }
});

/* ── Edit transaction amount ─────────────────────────────────── */
router.put("/transactions/:id/amount", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { newAmount } = req.body as { newAmount: number };

    if (!newAmount || newAmount <= 0) {
      res.status(400).json({ error: "المبلغ غير صحيح" });
      return;
    }

    const [tx] = await db
      .select()
      .from(financialTransactionsTable)
      .where(eq(financialTransactionsTable.id, id))
      .limit(1);

    if (!tx) { res.status(404).json({ error: "العملية غير موجودة" }); return; }

    const [current] = await db
      .select()
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.id, tx.beneficiaryId))
      .limit(1);

    if (!current) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }

    const oldAmt = parseFloat(tx.amount.replace(/,/g, "")) || 0;
    const diff = newAmount - oldAmt;
    const formatted = newAmount.toLocaleString("en-US");

    type BeneficiaryUpdate = {
      profits?: string;
      fees?: string;
      liberationFee?: string;
      transactionFee?: string;
    };

    let benefUpdate: BeneficiaryUpdate = {};

    if (tx.type === "add_profits") {
      const cur = parseInt(current.profits.replace(/,/g, ""), 10) || 0;
      benefUpdate = { profits: Math.max(0, cur + diff).toLocaleString("en-US") };
    } else if (tx.type === "add_fees") {
      const cur = parseInt(current.fees.replace(/,/g, ""), 10) || 0;
      const next = Math.max(0, cur + diff);
      benefUpdate = { fees: next === 0 ? "0" : next.toLocaleString("en-US") };
    } else if (tx.type === "add_liberation_fee") {
      benefUpdate = { liberationFee: formatted };
    } else if (tx.type === "add_transaction_fee") {
      benefUpdate = { transactionFee: formatted };
    } else {
      const addMatch = tx.type.match(/^add_custom_phase_(\d+)$/);
      if (addMatch) {
        const phaseId = Number(addMatch[1]);
        await db
          .update(userCustomPhasesTable)
          .set({ amount: formatted, status: "unpaid" })
          .where(
            and(
              eq(userCustomPhasesTable.userId, tx.beneficiaryId),
              eq(userCustomPhasesTable.phaseId, phaseId),
            ),
          );
      }
    }

    if (Object.keys(benefUpdate).length > 0) {
      await db
        .update(beneficiariesTable)
        .set(benefUpdate)
        .where(eq(beneficiariesTable.id, tx.beneficiaryId));
    }

    // Update description to reflect new amount
    const newDescription = tx.description.replace(/[\d,]+(?= ر\.س)/, formatted);

    const [updatedTx] = await db
      .update(financialTransactionsTable)
      .set({ amount: String(newAmount), description: newDescription })
      .where(eq(financialTransactionsTable.id, id))
      .returning();

    res.json({ transaction: updatedTx });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تعديل مبلغ العملية" });
  }
});

export default router;
