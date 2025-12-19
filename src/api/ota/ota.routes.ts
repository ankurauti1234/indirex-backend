// src/api/ota/ota.routes.ts
import { Router } from "express";
import { createJob, getMyJobs } from "./ota.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { createOtaJobSchema, getMyJobsSchema } from "./ota.validation"; // import new schema

const router = Router();

// Only logged-in developers/admins
router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

router.post(
  "/create-job",
  validationMiddleware({ body: createOtaJobSchema }),
  ...createJob
);

router.get(
  "/my-jobs",
  validationMiddleware({ query: getMyJobsSchema }), // ← Add query validation
  getMyJobs
);

export default router;
