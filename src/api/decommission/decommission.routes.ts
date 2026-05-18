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
import { sendSuccess } from "../../utils/response";

const router = Router();

// Middleware to return empty data for viewer role
const restrictViewer = (emptyData: any) => (req: any, res: any, next: any) => {
  if (req.user?.role === UserRole.VIEWER) {
    return (sendSuccess as any)(res, emptyData, "Viewer Restricted Access");
  }
  next();
};

router.use(protect);

router.get(
  "/assigned",
  restrictViewer({ meters: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({ query: listAssignedMetersSchema }),
  getAssignedMeters
);

router.post(
  "/decommission",
  authorize(UserRole.ADMIN, UserRole.DEVELOPER),
  validationMiddleware({ body: decommissionMeterSchema }),
  decommissionMeter
);

router.get(
  "/logs",
  restrictViewer({ logs: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({ query: getDecommissionLogsSchema }),
  getDecommissionLogs
);

export default router;