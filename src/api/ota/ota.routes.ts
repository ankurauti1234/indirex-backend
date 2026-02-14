// src/api/ota/ota.routes.ts
import { Router } from "express";
import { createJob, getMyJobs } from "./ota.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { createOtaJobSchema, getMyJobsSchema } from "./ota.validation"; // import new schema
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

// Only logged-in developers/admins
router.post(
  "/create-job",
  authorize(UserRole.ADMIN, UserRole.DEVELOPER),
  validationMiddleware({ body: createOtaJobSchema }),
  ...createJob
);

router.get(
  "/my-jobs",
  restrictViewer({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({ query: getMyJobsSchema }), // ← Add query validation
  getMyJobs
);

export default router;
