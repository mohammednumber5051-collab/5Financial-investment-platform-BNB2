import { Router, type IRouter } from "express";
import healthRouter from "./health";
import beneficiariesRouter from "./beneficiaries";
import notificationsRouter from "./notifications";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(beneficiariesRouter);
router.use(notificationsRouter);

export default router;
