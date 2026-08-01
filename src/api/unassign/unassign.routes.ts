import { Router } from "express";
import { getUnassignLogs } from "./unassign.controller";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { getUnassignLogsSchema } from "./unassign.validation";

const router = Router();

router.use(protect);

// GET /api/v1/unassign/logs — admin only
router.get(
  "/logs",
  authorize(UserRole.ADMIN),
  validationMiddleware({ query: getUnassignLogsSchema }),
  getUnassignLogs
);

export default router;