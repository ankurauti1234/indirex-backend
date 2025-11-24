import { Router } from "express";
import reportsROuter from "./reports.routes";
const router = Router();
router.use("/", reportsROuter);

export default router;