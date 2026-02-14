// src/api/assets/assets.routes.ts
import { Router } from "express";
import {
  uploadMeters,
  getMeters,
  updateMeter,
  deleteMeter,
  getThingGroups,
  getThingsInGroup,
  getUnregisteredInGroup,
} from "./assets.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  uploadSchema,
  listMetersSchema,
  groupsSchema,
  groupThingsSchema,
  updateMeterSchema,
} from "./assets.validation";
import Joi from "joi";
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

// POST /assets/upload
router.post("/upload", authorize(UserRole.ADMIN, UserRole.DEVELOPER), validationMiddleware({ body: uploadSchema }), uploadMeters);

// GET /assets/meters
router.get("/meters",
  restrictViewer({ meters: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({ query: listMetersSchema }),
  getMeters
);

// PUT /assets/meters/:meterId
router.put(
  "/meters/:meterId",
  authorize(UserRole.ADMIN, UserRole.DEVELOPER),
  validationMiddleware({
    params: Joi.object({ meterId: Joi.string().required() }),
    body: updateMeterSchema,
  }),
  updateMeter
);

// DELETE /assets/meters/:meterId
router.delete(
  "/meters/:meterId",
  authorize(UserRole.ADMIN, UserRole.DEVELOPER),
  validationMiddleware({
    params: Joi.object({ meterId: Joi.string().required() }),
  }),
  deleteMeter
);

// GET /assets/groups
router.get("/groups",
  restrictViewer({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({ query: groupsSchema }),
  getThingGroups
);

// GET /assets/groups/:groupName
router.get(
  "/groups/:groupName",
  restrictViewer({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({
    params: Joi.object({ groupName: Joi.string().required() }),
    query: groupThingsSchema,
  }),
  getThingsInGroup
);

// GET /assets/groups/:groupName/unregistered
router.get(
  "/groups/:groupName/unregistered",
  restrictViewer([]),
  validationMiddleware({
    params: Joi.object({ groupName: Joi.string().required() }),
  }),
  getUnregisteredInGroup
);

export default router;