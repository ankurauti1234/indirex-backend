// src/api/remote-access/remote-access.routes.ts
import { Router } from "express";
import { listMeters } from "./remote-access.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
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

router.get("/meters", restrictViewer({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), listMeters);

export default router;