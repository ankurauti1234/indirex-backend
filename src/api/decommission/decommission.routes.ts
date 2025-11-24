// src/api/decommission/decommission.routes.ts
import { Router } from "express";
import {
  getAssignedMeters,
  decommissionMeter,
  getDecommissionLogs,
} from "./decommission.controller";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import {
  decommissionMeterSchema,
  listAssignedMetersSchema,
  getDecommissionLogsSchema,
} from "./decommission.validation";

const router = Router();

// All routes require admin
router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

router.get(
  "/assigned",
  validationMiddleware({ query: listAssignedMetersSchema }),
  getAssignedMeters
);

router.post(
  "/decommission",
  validationMiddleware({ body: decommissionMeterSchema }),
  decommissionMeter
);

router.get(
  "/logs",
  validationMiddleware({ query: getDecommissionLogsSchema }),
  getDecommissionLogs
);

export default router;