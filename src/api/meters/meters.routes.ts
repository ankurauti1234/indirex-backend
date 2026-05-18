// src/api/meters/meters.routes.ts
import { Router } from "express";
import { getMeterStats, getInstalledMeters } from "./meters.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

router.use(protect);

// GET /api/v1/meters/stats
router.get("/stats", getMeterStats);

// GET /api/v1/meters/installed
router.get("/installed", getInstalledMeters);

export default router;