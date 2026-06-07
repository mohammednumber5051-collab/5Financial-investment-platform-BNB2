import { Router, type IRouter } from "express";
import healthRouter from "./health";
import beneficiariesRouter from "./beneficiaries";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(beneficiariesRouter);
router.use(notificationsRouter);

export default router;
