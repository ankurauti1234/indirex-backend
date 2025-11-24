// src/api/ota/ota.routes.ts
import { Router } from "express";
import { createJob, getMyJobs } from "./ota.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { createOtaJobSchema } from "./ota.validation";

const router = Router();

// Only logged-in developers
router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

router.post("/create-job", validationMiddleware({ body: createOtaJobSchema }), ...createJob);
router.get("/my-jobs", getMyJobs);

export default router;