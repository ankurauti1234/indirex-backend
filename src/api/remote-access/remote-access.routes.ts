// src/api/remote-access/remote-access.routes.ts
import { Router } from "express";
import { listMeters } from "./remote-access.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";

const router = Router();

router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

router.get("/meters", listMeters);

export default router;