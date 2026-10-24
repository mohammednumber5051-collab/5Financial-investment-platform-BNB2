import { Router, type IRouter } from "express";
import { db, adminsTable, beneficiariesTable, staffUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      return;
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // 1. Check Super Admin Table
    let admin = null;
    try {
      const results = await db
        .select()
        .from(adminsTable)
        .where(eq(adminsTable.username, cleanUsername))
        .limit(1);
      if (Array.isArray(results) && results.length > 0) {
        admin = results[0];
      }
    } catch {
      // ignore
    }

    if (admin) {
      const match = await bcrypt.compare(cleanPassword, admin.passwordHash);
      if (match) {
        res.json({ success: true, role: "admin", username: admin.username });
        return;
      }
    }

    // Default admin fallback when database is not yet seeded
    const defaultUser = (process.env.ADMIN_USERNAME || "Assubaihi").trim();
    const defaultPass = (process.env.ADMIN_PASSWORD || "admin123").trim();
    if (cleanUsername === defaultUser && cleanPassword === defaultPass) {
      res.json({ success: true, role: "admin", username: defaultUser });
      return;
    }

    // 2. Check Staff Users Table (Sub-admins / Supervisors)
    let staff = null;
    try {
      const staffResults = await db
        .select()
        .from(staffUsersTable)
        .where(eq(staffUsersTable.username, cleanUsername))
        .limit(1);
      if (Array.isArray(staffResults) && staffResults.length > 0) {
        staff = staffResults[0];
      }
    } catch {
      // ignore
    }

    if (staff) {
      if (staff.status === "disabled" || staff.status === "suspended") {
        res.status(403).json({ error: "حساب المشرف مجمد أو معطل حالياً، يُرجى مراجعة المسؤول" });
        return;
      }

      const match = await bcrypt.compare(cleanPassword, staff.passwordHash);
      if (match) {
        res.json({
          success: true,
          role: "staff",
          staff: {
            id: staff.id,
            username: staff.username,
            name: staff.name,
            status: staff.status,
            maxBeneficiariesQuota: staff.maxBeneficiariesQuota,
            canEditBeneficiaries: staff.canEditBeneficiaries,
            canManagePhases: staff.canManagePhases,
            canAddBeneficiaries: staff.canAddBeneficiaries,
          },
        });
        return;
      }
    }

    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تسجيل الدخول" });
  }
});

router.post("/auth/staff/change-password", async (req, res): Promise<void> => {
  try {
    const { staffId, oldPassword, newPassword } = req.body as {
      staffId?: number;
      oldPassword?: string;
      newPassword?: string;
    };

    if (!staffId || !oldPassword || !newPassword) {
      res.status(400).json({ error: "جميع الحقول مطلوبة" });
      return;
    }

    if (newPassword.trim().length < 4) {
      res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل" });
      return;
    }

    const [staff] = await db
      .select()
      .from(staffUsersTable)
      .where(eq(staffUsersTable.id, Number(staffId)))
      .limit(1);

    if (!staff) {
      res.status(404).json({ error: "المستخدم غير موجود" });
      return;
    }

    const match = await bcrypt.compare(oldPassword.trim(), staff.passwordHash);
    if (!match) {
      res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
      return;
    }

    const cleanNew = newPassword.trim();
    const newHash = await bcrypt.hash(cleanNew, 10);

    await db
      .update(staffUsersTable)
      .set({
        passwordHash: newHash,
        plainPassword: cleanNew,
        updatedAt: new Date(),
      })
      .where(eq(staffUsersTable.id, Number(staffId)));

    res.json({ success: true, message: "تم تحديث كلمة المرور بنجاح" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحديث كلمة المرور" });
  }
});

function normalizeDigits(str: string): string {
  if (!str) return "";
  const ar = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(ar[i], "g"), String(i));
    res = res.replace(new RegExp(fa[i], "g"), String(i));
  }
  return res;
}

function normalizeArabicText(str: string): string {
  if (!str) return "";
  return str
    .replace(/[أإآ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/[\u064B-\u0652]/g, "") // remove tashkeel
    .trim()
    .toLowerCase();
}

router.post("/auth/beneficiary/login", async (req, res): Promise<void> => {
  try {
    const { username, password, slug } = req.body as {
      username?: string;
      password?: string;
      slug?: string;
    };

    if (!password) {
      res.status(400).json({ error: "كلمة المرور مطلوبة" });
      return;
    }

    const rawUser = (username || "").trim();
    const cleanUser = rawUser.toLowerCase().replace(/^@/, "");
    const normUser = normalizeArabicText(cleanUser);
    const rawSlug = (slug || "").trim();
    const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().replace(/^@/, "");
    const cleanPassword = password.trim();
    const normPassword = normalizeDigits(cleanPassword);

    // Fetch all beneficiaries
    const all = await db.select().from(beneficiariesTable);

    // 1. Try matching explicitly by entered username/slug/phone/name first
    let row = all.find((b: any) => {
      const bUser = (b.username || "").toLowerCase().replace(/^@/, "");
      const bSlug = (b.loginSlug || "").toLowerCase().replace(/^@/, "");
      const bPhone = (b.phone || "").replace(/[\s+-]/g, "");
      const cleanPhone = cleanUser.replace(/[\s+-]/g, "");
      const bName = normalizeArabicText(b.name || "");

      if (cleanUser && bUser === cleanUser) return true;
      if (cleanUser && bSlug === cleanUser) return true;
      if (cleanPhone && bPhone && bPhone === cleanPhone) return true;
      if (normUser && bName && (bName === normUser || bName.includes(normUser))) return true;
      return false;
    });

    // 2. If no match by entered username, fallback to client URL slug
    if (!row && cleanSlug) {
      row = all.find((b: any) => {
        const bSlug = (b.loginSlug || "").toLowerCase().replace(/^@/, "");
        const bUser = (b.username || "").toLowerCase().replace(/^@/, "");
        if (bSlug && bSlug === cleanSlug) return true;
        if (bUser && bUser === cleanSlug) return true;
        if (String(b.id) === cleanSlug) return true;
        return false;
      });
    }

    if (!row) {
      res.status(401).json({ error: "اسم المستخدم أو رابط الدخول غير صحيح" });
      return;
    }

    if (row.status === "disabled") {
      res.status(403).json({ error: "هذا الحساب معطّل. تواصل مع الإدارة" });
      return;
    }

    // Verify Password with support for Arabic digits and formatting
    let match = false;
    const testPasswords = Array.from(new Set([
      cleanPassword,
      normPassword,
      cleanPassword.replace(/\s/g, ""),
      normPassword.replace(/\s/g, ""),
    ]));

    if (row.passwordHash) {
      for (const p of testPasswords) {
        try {
          if (await bcrypt.compare(p, row.passwordHash)) {
            match = true;
            break;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!match && row.plainPassword) {
      const cleanPlain = row.plainPassword.trim();
      const normPlain = normalizeDigits(cleanPlain);
      for (const p of testPasswords) {
        if (
          cleanPlain === p ||
          normPlain === p ||
          cleanPlain.replace(/\s/g, "") === p ||
          normPlain.replace(/\s/g, "") === p
        ) {
          match = true;
          // Auto-heal hash
          try {
            const freshHash = await bcrypt.hash(cleanPassword, 10);
            await db
              .update(beneficiariesTable)
              .set({ passwordHash: freshHash })
              .where(eq(beneficiariesTable.id, row.id));
          } catch {
            // ignore
          }
          break;
        }
      }
    }

    if (!match) {
      res.status(401).json({ error: "كلمة المرور غير صحيحة" });
      return;
    }

    const { passwordHash: _ph, plainPassword: _pp, ...safeUser } = row;
    res.json({ success: true, id: row.id, user: safeUser });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تسجيل الدخول" });
  }
});

export default router;
