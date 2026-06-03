import { Router, type IRouter } from "express";
import healthRouter from "./health";
import beneficiariesRouter from "./beneficiaries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(beneficiariesRouter);

export default router;
