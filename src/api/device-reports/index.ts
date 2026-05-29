import { Router } from "express";
import { getHealthReports, getSilentReports } from "./device-reports.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.use(protect);

// GET /api/v1/device-reports/health
router.get("/health", getHealthReports);

// GET /api/v1/device-reports/silent
router.get("/silent", getSilentReports);

export default router;