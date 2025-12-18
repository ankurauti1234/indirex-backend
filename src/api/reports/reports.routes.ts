// src/api/reports/reports.routes.ts
import { Router } from "express";
import { getReport } from "./reports.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { reportQuerySchema } from "./reports.validation";

const router = Router();

router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

router.get("/", validationMiddleware({ query: reportQuerySchema }), getReport);

export default router; 