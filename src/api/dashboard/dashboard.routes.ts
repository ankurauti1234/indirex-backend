// src/api/dashboard/dashboard.routes.ts
import { Router } from "express";
import { getDashboardStats } from "./dashboard.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.use(protect);

// GET /api/v1/dashboard/stats
router.get("/stats", getDashboardStats);

export default router;