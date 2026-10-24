import { Router, type IRouter } from "express";
import {
  db,
  beneficiariesTable,
  staffUsersTable,
  notificationsTable,
  financialTransactionsTable,
  userCustomPhasesTable,
  customPhasesTable,
} from "@workspace/db";
import { eq, getTableColumns } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// للمستفيد: يُخفي كلمة المرور تماماً
function safeColumnsPublic() {
  const { passwordHash: _ph, plainPassword: _pp, ...rest } = getTableColumns(beneficiariesTable);
  return rest;
}

// للأدمن: يُخفي الهاش فقط ويُظهر كلمة المرور النصية
function safeColumnsAdmin() {
  const { passwordHash: _ph, ...rest } = getTableColumns(beneficiariesTable);
  return rest;
}

// GET /api/beneficiaries - جلب المستفيدين مع دعم تصفية المشرف
router.get("/beneficiaries", async (req, res) => {
  try {
    const staffId = req.query.staffId ? Number(req.query.staffId) : null;

    let rows;
    if (staffId && !isNaN(staffId)) {
      rows = await db
        .select(safeColumnsAdmin())
        .from(beneficiariesTable)
        .where(eq(beneficiariesTable.assignedStaffId, staffId))
        .orderBy(beneficiariesTable.createdAt);
    } else {
      rows = await db
        .select(safeColumnsAdmin())
        .from(beneficiariesTable)
        .orderBy(beneficiariesTable.createdAt);
    }

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل البيانات" });
  }
});

// GET /api/beneficiaries/by-slug/:slug - استعلام المستفيد عبر الرابط الفريد
router.get("/beneficiaries/by-slug/:slug", async (req, res): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const cleanSlug = decodeURIComponent(rawSlug).trim().toLowerCase();

    const all = await db.select(safeColumnsPublic()).from(beneficiariesTable);
    const row = all.find((b: any) => {
      const matchSlug = b.loginSlug && b.loginSlug.toLowerCase() === cleanSlug;
      const matchUser = b.username && b.username.toLowerCase() === cleanSlug;
      const matchId = String(b.id) === cleanSlug;
      return matchSlug || matchUser || matchId;
    });

    if (!row) {
      res.status(404).json({ error: "الرابط غير موجود" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل البيانات" });
  }
});

// GET /api/beneficiaries/:id - استعلام مستفيد محدد بالمعرّف
router.get("/beneficiaries/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "معرّف المستفيد غير صحيح" });
      return;
    }

    const all = await db.select(safeColumnsPublic()).from(beneficiariesTable);
    const row = all.find((b: any) => Number(b.id) === id);

    if (!row) {
      res.status(404).json({ error: "المستفيد غير موجود" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل البيانات" });
  }
});

// POST /api/beneficiaries - إضافة مستفيد جديد مع التحقق من كوتة المشرف
router.post("/beneficiaries", async (req, res): Promise<void> => {
  try {
    const body = req.body as {
      username: string;
      password?: string;
      name: string;
      profits?: string;
      subscription?: string;
      fees?: string;
      accountHolder?: string;
      iban?: string;
      phone?: string;
      status?: string;
      loginTitle?: string;
      loginSlug?: string;
      telegramLink?: string;
      assignedStaffId?: number | null;
      staffId?: number | null; // إذا أضافه المشرف بنفسه
    };

    const actingStaffId = body.staffId || body.assignedStaffId;

    if (actingStaffId && !isNaN(Number(actingStaffId))) {
      const [staff] = await db
        .select()
        .from(staffUsersTable)
        .where(eq(staffUsersTable.id, Number(actingStaffId)))
        .limit(1);

      if (!staff) {
        res.status(404).json({ error: "المشرف غير موجود" });
        return;
      }

      if (staff.status !== "active") {
        res.status(403).json({ error: "حساب المشرف غير نشط" });
        return;
      }

      if (!staff.canAddBeneficiaries) {
        res.status(403).json({ error: "ليس لديك صلاحية إضافة مستفيدين جدد" });
        return;
      }

      // Check Quota
      const allStaffBeneficiaries = await db
        .select({ id: beneficiariesTable.id })
        .from(beneficiariesTable)
        .where(eq(beneficiariesTable.assignedStaffId, staff.id));

      if (allStaffBeneficiaries.length >= staff.maxBeneficiariesQuota) {
        res.status(400).json({
          error: `لقد استنفدت الحد الأقصى المسموح به لحسابك (${staff.maxBeneficiariesQuota} مستفيدين). يُرجى التواصل مع المسؤول الرئيسي لزيادة الحصة.`,
        });
        return;
      }
    }

    const trimmedUsername = (body.username || "").trim();
    const trimmedSlug = (body.loginSlug || "").trim();

    if (!trimmedUsername) {
      res.status(400).json({ error: "اسم المستخدم مطلوب" });
      return;
    }

    // Check duplicate username or loginSlug
    const allBeneficiaries = await db.select().from(beneficiariesTable);
    const duplicate = allBeneficiaries.find((b: any) => {
      const matchUser = b.username && b.username.toLowerCase() === trimmedUsername.toLowerCase();
      const matchSlug = trimmedSlug && b.loginSlug && b.loginSlug.toLowerCase() === trimmedSlug.toLowerCase();
      return matchUser || matchSlug;
    });

    if (duplicate) {
      // Idempotency: If exact duplicate was submitted within the last 20s (double click / mobile bounce), return created safely
      const diffSec = (Date.now() - new Date(duplicate.createdAt || 0).getTime()) / 1000;
      if (diffSec < 20) {
        const { passwordHash: _ph, ...safe } = duplicate;
        res.status(200).json(safe);
        return;
      }
      res.status(409).json({ error: "اسم المستخدم أو رابط الدخول مسجل مسبقاً لمستفيد آخر" });
      return;
    }

    const normalizedPassword = body.password ? body.password.replace(/\s/g, "") : "";
    const passwordHash = normalizedPassword ? await bcrypt.hash(normalizedPassword, 10) : "";

    const [row] = await db
      .insert(beneficiariesTable)
      .values({
        username: trimmedUsername,
        passwordHash,
        plainPassword: body.password ?? "",
        name: (body.name || "").trim(),
        profits: body.profits ?? "0",
        subscription: body.subscription ?? "0",
        fees: body.fees ?? "0",
        accountHolder: (body.accountHolder || "").trim(),
        iban: (body.iban || "").trim(),
        phone: (body.phone || "").trim(),
        status: body.status ?? "active",
        loginTitle: (body.loginTitle || "").trim(),
        loginSlug: trimmedSlug,
        telegramLink: (body.telegramLink || "").trim(),
        assignedStaffId: actingStaffId ? Number(actingStaffId) : null,
      })
      .returning();

    const { passwordHash: _ph, ...safe } = row;
    res.status(201).json(safe);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إضافة المستفيد" });
  }
});

// PUT /api/beneficiaries/:id - تعديل المستفيد مع قفل الحقول الحساسة للمشرف
router.put("/beneficiaries/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const body = req.body as Partial<{
      username: string;
      password: string;
      name: string;
      profits: string;
      subscription: string;
      fees: string;
      accountHolder: string;
      iban: string;
      phone: string;
      status: string;
      loginTitle: string;
      loginSlug: string;
      telegramLink: string;
      assignedStaffId: number | null;
      isStaff: boolean;
      staffId: number;
    }>;

    const [existing] = await db
      .select()
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "المستفيد غير موجود" });
      return;
    }

    // Check staff permissions
    if (body.isStaff && body.staffId) {
      const [staff] = await db
        .select()
        .from(staffUsersTable)
        .where(eq(staffUsersTable.id, Number(body.staffId)))
        .limit(1);

      if (!staff || !staff.canEditBeneficiaries) {
        res.status(403).json({ error: "ليس لديك صلاحية تعديل بيانات المستفيد" });
        return;
      }

      // If assigned to a different staff member, prevent edit
      if (existing.assignedStaffId && Number(existing.assignedStaffId) !== Number(body.staffId)) {
        res.status(403).json({ error: "لا يمكنك تعديل مستفيد غير مرتبط بحسابك" });
        return;
      }
    }

    const updates: Record<string, unknown> = {};

    // Fields strictly PROTECTED from staff edit:
    // 1. name, 2. accountHolder, 3. username, 4. iban, 5. loginSlug
    if (body.isStaff) {
      // Ignore sensitive fields completely if modified by staff
      // (Keeps original value from existing record)
    } else {
      // Super Admin can edit all fields
      if (body.name !== undefined) updates.name = body.name.trim();
      if (body.accountHolder !== undefined) updates.accountHolder = body.accountHolder.trim();
      if (body.username !== undefined) updates.username = body.username.trim();
      if (body.iban !== undefined) updates.iban = body.iban.trim();
      if (body.loginSlug !== undefined) updates.loginSlug = body.loginSlug.trim();
      if (body.assignedStaffId !== undefined) updates.assignedStaffId = body.assignedStaffId;
    }

    // Validate uniqueness on edit if username or loginSlug changed
    if (updates.username || updates.loginSlug) {
      const allBeneficiaries = await db.select().from(beneficiariesTable);
      const conflict = allBeneficiaries.find((b: any) => {
        if (Number(b.id) === id) return false;
        const matchUser = updates.username && b.username && b.username.toLowerCase() === String(updates.username).toLowerCase();
        const matchSlug = updates.loginSlug && b.loginSlug && b.loginSlug.toLowerCase() === String(updates.loginSlug).toLowerCase();
        return matchUser || matchSlug;
      });
      if (conflict) {
        res.status(409).json({ error: "اسم المستخدم أو رابط الدخول مسجل مسبقاً لمستفيد آخر" });
        return;
      }
    }

    // Non-protected fields (editable by staff if granted permission, or by admin)
    if (body.password) {
      const normalizedPassword = body.password.replace(/\s/g, "");
      updates.passwordHash = normalizedPassword ? await bcrypt.hash(normalizedPassword, 10) : "";
      updates.plainPassword = body.password;
    }
    if (body.profits !== undefined) updates.profits = body.profits;
    if (body.subscription !== undefined) updates.subscription = body.subscription;
    if (body.fees !== undefined) updates.fees = body.fees;
    if (body.phone !== undefined) updates.phone = body.phone.trim();
    if (body.status !== undefined) updates.status = body.status;
    if (body.loginTitle !== undefined) updates.loginTitle = body.loginTitle.trim();
    if (body.telegramLink !== undefined) updates.telegramLink = body.telegramLink.trim();
    if (body.phase1Visible !== undefined) updates.phase1Visible = Boolean(body.phase1Visible);
    if (body.phase2Visible !== undefined) updates.phase2Visible = Boolean(body.phase2Visible);
    if (body.phase3Visible !== undefined) updates.phase3Visible = Boolean(body.phase3Visible);
    if (body.liberationFee !== undefined) updates.liberationFee = body.liberationFee;
    if (body.transactionFee !== undefined) updates.transactionFee = body.transactionFee;

    const [row] = await db
      .update(beneficiariesTable)
      .set(updates)
      .where(eq(beneficiariesTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "المستفيد غير موجود" });
      return;
    }

    const { passwordHash: _ph, ...safe } = row;
    res.json(safe);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تعديل المستفيد" });
  }
});

// POST /api/beneficiaries/:id/pay-partial-fee - نظام السداد الجزئي للرسوم والمراحل
router.post("/beneficiaries/:id/pay-partial-fee", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { phaseType, amountPaid } = req.body as {
      phaseType: "withdrawal" | "liberation" | "transaction" | string;
      amountPaid: number;
    };

    if (!phaseType || amountPaid === undefined || isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      res.status(400).json({ error: "نوع المرحلة ومبلغ السداد مطلوبان وصالحان" });
      return;
    }

    const [beneficiary] = await db
      .select()
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.id, id))
      .limit(1);

    if (!beneficiary) {
      res.status(404).json({ error: "المستفيد غير موجود" });
      return;
    }

    const paidNum = Number(amountPaid);
    const paidFormatted = paidNum.toLocaleString("en-US");
    let phaseLabel = "";
    let originalAmount = 0;
    let newRemaining = 0;

    if (phaseType === "withdrawal") {
      phaseLabel = "رسوم فتح بوابة السحب (المرحلة الأولى)";
      originalAmount = Number(beneficiary.fees?.replace(/,/g, "") || "0");
      newRemaining = Math.max(0, originalAmount - paidNum);

      if (newRemaining <= 0) {
        await db
          .update(beneficiariesTable)
          .set({ fees: "0", withdrawalFeeStatus: "paid", withdrawalFeePaidAt: new Date() })
          .where(eq(beneficiariesTable.id, id));
      } else {
        await db
          .update(beneficiariesTable)
          .set({ fees: String(newRemaining) })
          .where(eq(beneficiariesTable.id, id));
      }
    } else if (phaseType === "liberation") {
      phaseLabel = "رسوم الإفراج المالي وفك الحظر (المرحلة الثانية)";
      originalAmount = Number(beneficiary.liberationFee?.replace(/,/g, "") || "0");
      newRemaining = Math.max(0, originalAmount - paidNum);

      if (newRemaining <= 0) {
        await db
          .update(beneficiariesTable)
          .set({ liberationFee: "0", liberationFeeStatus: "paid", liberationFeePaidAt: new Date() })
          .where(eq(beneficiariesTable.id, id));
      } else {
        await db
          .update(beneficiariesTable)
          .set({ liberationFee: String(newRemaining) })
          .where(eq(beneficiariesTable.id, id));
      }
    } else if (phaseType === "transaction") {
      phaseLabel = "رسوم المعاملة المصرفية (المرحلة الثالثة)";
      originalAmount = Number(beneficiary.transactionFee?.replace(/,/g, "") || "0");
      newRemaining = Math.max(0, originalAmount - paidNum);

      if (newRemaining <= 0) {
        await db
          .update(beneficiariesTable)
          .set({ transactionFee: "0", transactionFeeStatus: "paid", transactionFeePaidAt: new Date() })
          .where(eq(beneficiariesTable.id, id));
      } else {
        await db
          .update(beneficiariesTable)
          .set({ transactionFee: String(newRemaining) })
          .where(eq(beneficiariesTable.id, id));
      }
    } else {
      // Custom phase by id
      const customPhaseId = Number(phaseType);
      const [customPhase] = await db
        .select()
        .from(customPhasesTable)
        .where(eq(customPhasesTable.id, customPhaseId))
        .limit(1);

      const [userCustom] = await db
        .select()
        .from(userCustomPhasesTable)
        .where(eq(userCustomPhasesTable.userId, id))
        .limit(1);

      phaseLabel = customPhase?.name || "مرحلة مخصصة";
      originalAmount = Number(userCustom?.amount?.replace(/,/g, "") || "0");
      newRemaining = Math.max(0, originalAmount - paidNum);

      if (userCustom) {
        if (newRemaining <= 0) {
          await db
            .update(userCustomPhasesTable)
            .set({ amount: "0", status: "paid", paidAt: new Date() })
            .where(eq(userCustomPhasesTable.id, userCustom.id));
        } else {
          await db
            .update(userCustomPhasesTable)
            .set({ amount: String(newRemaining) })
            .where(eq(userCustomPhasesTable.id, userCustom.id));
        }
      }
    }

    const remainingFormatted = newRemaining.toLocaleString("en-US");

    // 1. Record financial transaction
    await db.insert(financialTransactionsTable).values({
      beneficiaryId: id,
      type: newRemaining <= 0 ? "full_fee_payment" : "partial_fee_payment",
      amount: String(paidNum),
      description:
        newRemaining <= 0
          ? `اكتمال سداد كامل رسوم: ${phaseLabel}`
          : `سداد جزئي لـ (${phaseLabel}): تم سداد ${paidFormatted} ر.س | المتبقي: ${remainingFormatted} ر.س`,
      createdAt: new Date(),
    });

    // 2. Deliver official notification to beneficiary
    const notifTitle = newRemaining <= 0 ? `تم اكتمال سداد ${phaseLabel}` : `سداد جزئي - ${phaseLabel}`;
    const notifMessage =
      newRemaining <= 0
        ? `تم اعتماد سداد كامل رسوم ${phaseLabel} بنجاح بقيمة ${paidFormatted} ر.س والانتقال للمرحلة التالية.`
        : `تم سداد مبلغ ${paidFormatted} ر.س من رسوم ${phaseLabel}.\n\nالمبلغ المتبقي المستحق عليكم لإكمال العملية هو ${remainingFormatted} ر.س.`;

    await db.insert(notificationsTable).values({
      beneficiaryId: id,
      type: newRemaining <= 0 ? "fees_fully_paid" : "partial_fee_paid",
      title: notifTitle,
      message: notifMessage,
      isRead: false,
      createdAt: new Date(),
    });

    const [updatedBeneficiary] = await db
      .select(safeColumnsAdmin())
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.id, id))
      .limit(1);

    res.json({
      success: true,
      paidAmount: paidNum,
      remainingAmount: newRemaining,
      isFullyPaid: newRemaining <= 0,
      beneficiary: updatedBeneficiary,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تنفيذ السداد الجزئي" });
  }
});

// DELETE /api/beneficiaries/:id - حذف المستفيد
router.delete("/beneficiaries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(beneficiariesTable).where(eq(beneficiariesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل حذف المستفيد" });
  }
});

export default router;
