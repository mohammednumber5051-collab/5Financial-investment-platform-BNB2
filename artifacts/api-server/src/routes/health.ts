import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { loadDatabase, resetDatabase } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/database/status", (_req, res) => {
  try {
    const store = loadDatabase();
    res.json({
      status: "operational",
      type: "persistent_storage",
      collections: {
        admins: store.admins?.length || 0,
        beneficiaries: store.beneficiaries?.length || 0,
        customPhases: store.custom_phases?.length || 0,
        userCustomPhases: store.user_custom_phases?.length || 0,
        financialTransactions: store.financial_transactions?.length || 0,
        notifications: store.notifications?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/database/reset", (_req, res) => {
  try {
    const reset = resetDatabase();
    res.json({
      success: true,
      message: "تمت إعادة تعيين قاعدة البيانات إلى الحالة الأولية بنجاح",
      counts: {
        admins: reset.admins?.length || 0,
        beneficiaries: reset.beneficiaries?.length || 0,
        customPhases: reset.custom_phases?.length || 0,
        financialTransactions: reset.financial_transactions?.length || 0,
        notifications: reset.notifications?.length || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
