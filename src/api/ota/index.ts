import { Router } from "express";
import otaRouter from "./ota.routes";

const router = Router();
router.use("/", otaRouter);

export default router;