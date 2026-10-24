import { Router } from "express";
import { db, adminsTable, beneficiariesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
const router = Router();
router.post("/auth/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
            return;
        }
        let admin = null;
        try {
            const results = await db
                .select()
                .from(adminsTable)
                .where(eq(adminsTable.username, username))
                .limit(1);
            if (Array.isArray(results) && results.length > 0) {
                admin = results[0];
            }
        }
        catch {
            // Database query error or empty mock
        }
        if (admin) {
            const match = await bcrypt.compare(password, admin.passwordHash);
            if (!match) {
                res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
                return;
            }
            res.json({ success: true, username: admin.username });
            return;
        }
        // Default admin fallback when database is not yet seeded or in mock mode
        const defaultUser = process.env.ADMIN_USERNAME || "Assubaihi";
        const defaultPass = process.env.ADMIN_PASSWORD || "admin123";
        if (username === defaultUser && password === defaultPass) {
            res.json({ success: true, username: defaultUser });
            return;
        }
        res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
    catch (err) {
        req.log.error(err);
        res.status(500).json({ error: "فشل تسجيل الدخول" });
    }
});
router.post("/auth/beneficiary/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
            return;
        }
        let row = null;
        try {
            const results = await db
                .select({
                id: beneficiariesTable.id,
                passwordHash: beneficiariesTable.passwordHash,
                status: beneficiariesTable.status,
            })
                .from(beneficiariesTable)
                .where(eq(beneficiariesTable.username, username))
                .limit(1);
            if (Array.isArray(results) && results.length > 0) {
                row = results[0];
            }
        }
        catch {
            // Database query error or mock
        }
        if (!row) {
            res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
            return;
        }
        if (row.status === "disabled") {
            res.status(403).json({ error: "disabled" });
            return;
        }
        const match = await bcrypt.compare(password.replace(/\s/g, ""), row.passwordHash);
        if (!match) {
            res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
            return;
        }
        res.json({ success: true, id: row.id });
    }
    catch (err) {
        req.log.error(err);
        res.status(500).json({ error: "فشل تسجيل الدخول" });
    }
});
export default router;
