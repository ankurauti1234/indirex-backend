// src/api/meters/meters.routes.ts
import { Router } from "express";
import {
  getMeterStats,
  getInstalledMeters,
  unassignMeter,
} from "./meters.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { unassignMeterSchema } from "./meters.validation";

const router = Router();

router.use(protect);

// GET /api/v1/meters/stats
router.get("/stats", getMeterStats);

// GET /api/v1/meters/installed
router.get("/installed", getInstalledMeters);

// GET /api/v1/meters/installed/regions
// POST /api/v1/meters/unassign
// Admin only — destructive action (removes a meter-household binding)
router.post(
  "/unassign",
  authorize(UserRole.ADMIN),
  validationMiddleware({ body: unassignMeterSchema }),
  unassignMeter
);

export default router;