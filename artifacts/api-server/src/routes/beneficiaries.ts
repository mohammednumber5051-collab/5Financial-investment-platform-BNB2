import { Router, type IRouter } from "express";
import { db, beneficiariesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/beneficiaries", async (req, res) => {
  try {
    const rows = await db.select().from(beneficiariesTable).orderBy(beneficiariesTable.createdAt);
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
      .select()
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
    const [row] = await db
      .insert(beneficiariesTable)
      .values({
        username: body.username,
        password: body.password,
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
    res.status(201).json(row);
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
    const [row] = await db
      .update(beneficiariesTable)
      .set({
        ...(body.username !== undefined && { username: body.username }),
        ...(body.password !== undefined && { password: body.password }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.profits !== undefined && { profits: body.profits }),
        ...(body.subscription !== undefined && { subscription: body.subscription }),
        ...(body.fees !== undefined && { fees: body.fees }),
        ...(body.accountHolder !== undefined && { accountHolder: body.accountHolder }),
        ...(body.iban !== undefined && { iban: body.iban }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.loginTitle !== undefined && { loginTitle: body.loginTitle }),
        ...(body.loginSlug !== undefined && { loginSlug: body.loginSlug }),
        ...(body.telegramLink !== undefined && { telegramLink: body.telegramLink }),
      })
      .where(eq(beneficiariesTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "المستفيد غير موجود" }); return; }
    res.json(row);
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
