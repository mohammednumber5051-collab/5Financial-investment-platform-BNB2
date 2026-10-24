import { Router, type IRouter } from "express";
import { db, staffUsersTable, beneficiariesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// GET /api/admin/staff - جلب قائمة المشرفين مع تفاصيل الحصص وكلمات المرور والمستفيدين
router.get("/admin/staff", async (req, res): Promise<void> => {
  try {
    const staffList = await db.select().from(staffUsersTable).orderBy(desc(staffUsersTable.createdAt));
    const allBeneficiaries = await db.select({ id: beneficiariesTable.id, assignedStaffId: beneficiariesTable.assignedStaffId }).from(beneficiariesTable);

    const enriched = staffList.map((staff: any) => {
      const assigned = allBeneficiaries.filter((b: any) => Number(b.assignedStaffId) === Number(staff.id));
      return {
        ...staff,
        assignedCount: assigned.length,
        assignedBeneficiaryIds: assigned.map((b: any) => b.id),
      };
    });

    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل قائمة المشرفين" });
  }
});

// POST /api/admin/staff - إنشاء مشرف جديد
router.post("/admin/staff", async (req, res): Promise<void> => {
  try {
    const {
      username,
      password,
      name,
      maxBeneficiariesQuota,
      canEditBeneficiaries,
      canManagePhases,
      canAddBeneficiaries,
      assignedBeneficiaryIds,
    } = req.body as {
      username?: string;
      password?: string;
      name?: string;
      maxBeneficiariesQuota?: number;
      canEditBeneficiaries?: boolean;
      canManagePhases?: boolean;
      canAddBeneficiaries?: boolean;
      assignedBeneficiaryIds?: number[];
    };

    if (!username || !password || !name) {
      res.status(400).json({ error: "اسم المستخدم وكلمة المرور والاسم الكامل مطلوبان" });
      return;
    }

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // Check existing
    const existing = await db
      .select()
      .from(staffUsersTable)
      .where(eq(staffUsersTable.username, cleanUser))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "اسم المستخدم مسجل مسبقاً لمشرف آخر" });
      return;
    }

    const passwordHash = await bcrypt.hash(cleanPass, 10);
    const quota = Number(maxBeneficiariesQuota) > 0 ? Number(maxBeneficiariesQuota) : 5;

    const [newStaff] = await db
      .insert(staffUsersTable)
      .values({
        username: cleanUser,
        passwordHash,
        plainPassword: cleanPass,
        name: name.trim(),
        status: "active",
        maxBeneficiariesQuota: quota,
        canEditBeneficiaries: canEditBeneficiaries ?? true,
        canManagePhases: canManagePhases ?? false,
        canAddBeneficiaries: canAddBeneficiaries ?? true,
      })
      .returning();

    // Link assigned beneficiaries if provided
    if (Array.isArray(assignedBeneficiaryIds) && assignedBeneficiaryIds.length > 0) {
      for (const bId of assignedBeneficiaryIds) {
        await db
          .update(beneficiariesTable)
          .set({ assignedStaffId: newStaff.id })
          .where(eq(beneficiariesTable.id, Number(bId)));
      }
    }

    res.status(201).json(newStaff);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إنشاء حساب المشرف" });
  }
});

// PUT /api/admin/staff/:id - تعديل بيانات المشرف وصلاحياته
router.put("/admin/staff/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      password,
      maxBeneficiariesQuota,
      canEditBeneficiaries,
      canManagePhases,
      canAddBeneficiaries,
      assignedBeneficiaryIds,
    } = req.body as {
      name?: string;
      password?: string;
      maxBeneficiariesQuota?: number;
      canEditBeneficiaries?: boolean;
      canManagePhases?: boolean;
      canAddBeneficiaries?: boolean;
      assignedBeneficiaryIds?: number[];
    };

    const [existing] = await db
      .select()
      .from(staffUsersTable)
      .where(eq(staffUsersTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "المشرف غير موجود" });
      return;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name.trim();
    if (maxBeneficiariesQuota !== undefined) {
      updateData.maxBeneficiariesQuota = Math.max(1, Number(maxBeneficiariesQuota));
    }
    if (canEditBeneficiaries !== undefined) updateData.canEditBeneficiaries = Boolean(canEditBeneficiaries);
    if (canManagePhases !== undefined) updateData.canManagePhases = Boolean(canManagePhases);
    if (canAddBeneficiaries !== undefined) updateData.canAddBeneficiaries = Boolean(canAddBeneficiaries);

    if (password && password.trim().length >= 4) {
      const cleanPass = password.trim();
      updateData.passwordHash = await bcrypt.hash(cleanPass, 10);
      updateData.plainPassword = cleanPass;
    }

    const [updatedStaff] = await db
      .update(staffUsersTable)
      .set(updateData)
      .where(eq(staffUsersTable.id, id))
      .returning();

    // Re-link beneficiaries if provided
    if (Array.isArray(assignedBeneficiaryIds)) {
      // First unassign all previously assigned to this staff
      const currentAssigned = await db
        .select({ id: beneficiariesTable.id })
        .from(beneficiariesTable)
        .where(eq(beneficiariesTable.assignedStaffId, id));

      for (const cur of currentAssigned) {
        if (!assignedBeneficiaryIds.includes(cur.id)) {
          await db
            .update(beneficiariesTable)
            .set({ assignedStaffId: null })
            .where(eq(beneficiariesTable.id, cur.id));
        }
      }

      // Assign new ones
      for (const newId of assignedBeneficiaryIds) {
        await db
          .update(beneficiariesTable)
          .set({ assignedStaffId: id })
          .where(eq(beneficiariesTable.id, Number(newId)));
      }
    }

    res.json(updatedStaff);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحديث بيانات المشرف" });
  }
});

// PATCH /api/admin/staff/:id/status - تجميد / تفعيل المشرف
router.patch("/admin/staff/:id/status", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: "active" | "suspended" | "disabled" };

    if (!["active", "suspended", "disabled"].includes(status)) {
      res.status(400).json({ error: "حالة غير صالحة" });
      return;
    }

    const [updated] = await db
      .update(staffUsersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(staffUsersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "المشرف غير موجود" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تغيير حالة المشرف" });
  }
});

// DELETE /api/admin/staff/:id - حذف المشرف
router.delete("/admin/staff/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);

    // Unassign beneficiaries
    const assigned = await db
      .select({ id: beneficiariesTable.id })
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.assignedStaffId, id));

    for (const b of assigned) {
      await db
        .update(beneficiariesTable)
        .set({ assignedStaffId: null })
        .where(eq(beneficiariesTable.id, b.id));
    }

    await db.delete(staffUsersTable).where(eq(staffUsersTable.id, id));
    res.json({ success: true, message: "تم حذف المشرف بنجاح" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل حذف المشرف" });
  }
});

export default router;
