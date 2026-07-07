import { Router, type IRouter } from "express";
import { db, beneficiariesTable } from "@workspace/db";
import { eq, getTableColumns } from "drizzle-orm";
import bcrypt from "bcrypt";

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

router.get("/beneficiaries", async (req, res) => {
  try {
    const rows = await db
      .select(safeColumnsAdmin())
      .from(beneficiariesTable)
      .orderBy(beneficiariesTable.createdAt);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تحميل البيانات" });
  }
});

router.get("/beneficiaries/by-slug/:slug", async (req, res): Promise<void> => {
  try {
    const slug = req.params.slug;
    const [row] = await db
      .select(safeColumnsPublic())
      .from(beneficiariesTable)
      .where(eq(beneficiariesTable.loginSlug, slug))
      .limit(1);
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

router.post("/beneficiaries", async (req, res) => {
  try {
    const body = req.body as {
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
    };
    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : "";
    const [row] = await db
      .insert(beneficiariesTable)
      .values({
        username: body.username,
        passwordHash,
        plainPassword: body.password ?? "",
        name: body.name,
        profits: body.profits ?? "0",
        subscription: body.subscription ?? "0",
        fees: body.fees ?? "0",
        accountHolder: body.accountHolder ?? "",
        iban: body.iban ?? "",
        phone: body.phone ?? "",
        status: body.status ?? "active",
        loginTitle: body.loginTitle ?? "",
        loginSlug: body.loginSlug ?? "",
        telegramLink: body.telegramLink ?? "",
      })
      .returning();
    const { passwordHash: _ph, ...safe } = row;
    res.status(201).json(safe);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل إضافة المستفيد" });
  }
});

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
    }>;

    const updates: Record<string, unknown> = {};
    if (body.username !== undefined) updates.username = body.username;
    if (body.password) {
      updates.passwordHash = await bcrypt.hash(body.password, 12);
      updates.plainPassword = body.password;
    }
    if (body.name !== undefined) updates.name = body.name;
    if (body.profits !== undefined) updates.profits = body.profits;
    if (body.subscription !== undefined) updates.subscription = body.subscription;
    if (body.fees !== undefined) updates.fees = body.fees;
    if (body.accountHolder !== undefined) updates.accountHolder = body.accountHolder;
    if (body.iban !== undefined) updates.iban = body.iban;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.status !== undefined) updates.status = body.status;
    if (body.loginTitle !== undefined) updates.loginTitle = body.loginTitle;
    if (body.loginSlug !== undefined) updates.loginSlug = body.loginSlug;
    if (body.telegramLink !== undefined) updates.telegramLink = body.telegramLink;

    const [row] = await db
      .update(beneficiariesTable)
      .set(updates)
      .where(eq(beneficiariesTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }
    const { passwordHash: _ph, ...safe } = row;
    res.json(safe);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تعديل المستفيد" });
  }
});

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
