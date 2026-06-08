import { Router, type IRouter } from "express";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const router: IRouter = Router();

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, username))
      .limit(1);

    if (!admin) {
      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      return;
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      return;
    }

    res.json({ success: true, username: admin.username });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "فشل تسجيل الدخول" });
  }
});

export default router;
