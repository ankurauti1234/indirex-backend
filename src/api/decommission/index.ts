import { Router } from "express";
import decommissionRouter from "./decommission.routes";

const router = Router();
router.use("/", decommissionRouter);

export default router; 