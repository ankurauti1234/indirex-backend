// src/api/reports/reports.routes.ts
import { Router } from "express";
import { getReport, getBridge, getUnbridge, getMemberwiseBridge, getMemberwiseUnbridge } from "./reports.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { reportQuerySchema } from "./reports.validation";
import { sendSuccess } from "../../utils/response";

const router = Router();

// Middleware to return empty data for viewer role
const restrictViewer = (emptyData: any) => (req: any, res: any, next: any) => {
    if (req.user?.role === UserRole.VIEWER) {
        return sendSuccess(res, emptyData, "Viewer Restricted Access");
    }
    next();
};

router.use(protect);

router.get("/",
    validationMiddleware({ query: reportQuerySchema }),
    restrictViewer([]),
    getReport
);
router.get("/bridge",
    validationMiddleware({ query: reportQuerySchema }),
    restrictViewer([]),
    getBridge
);
router.get("/unbridge",
    validationMiddleware({ query: reportQuerySchema }),
    restrictViewer([]),
    getUnbridge
);
router.get("/memberwise-bridge",
    validationMiddleware({ query: reportQuerySchema }),
    restrictViewer([]),
    getMemberwiseBridge
);
router.get("/memberwise-unbridge",
    validationMiddleware({ query: reportQuerySchema }),
    restrictViewer([]),
    getMemberwiseUnbridge
);

export default router; 