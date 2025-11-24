import { Router } from "express";
import authRouter from "./auth/auth.routes";
import eventsRouter from "./events";
import otaRouter from "./ota";
import remoteAccessRouter from "./remote-access";
import reportsRouter from "./reports";
import assetsRouter from "./assets";
import householdRouter from "./household";
import decommissionRouter from "./decommission";

const router = Router();

router.use("/auth", authRouter);
router.use("/events", eventsRouter);
router.use("/ota", otaRouter);
router.use("/remote-access", remoteAccessRouter);
router.use("/reports", reportsRouter);
router.use("/assets", assetsRouter);
router.use("/households", householdRouter);
router.use("/decommission", decommissionRouter);

export default router;