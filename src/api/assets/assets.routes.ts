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

const router = Router();

router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

// POST /assets/upload
router.post("/upload", validationMiddleware({ body: uploadSchema }), uploadMeters);

// GET /assets/meters
router.get("/meters", validationMiddleware({ query: listMetersSchema }), getMeters);

// PUT /assets/meters/:meterId
router.put(
  "/meters/:meterId",
  validationMiddleware({
    params: Joi.object({ meterId: Joi.string().required() }),
    body: updateMeterSchema,
  }),
  updateMeter
);

// DELETE /assets/meters/:meterId
router.delete(
  "/meters/:meterId",
  validationMiddleware({
    params: Joi.object({ meterId: Joi.string().required() }),
  }),
  deleteMeter
);

// GET /assets/groups
router.get("/groups", validationMiddleware({ query: groupsSchema }), getThingGroups);

// GET /assets/groups/:groupName
router.get(
  "/groups/:groupName",
  validationMiddleware({
    params: Joi.object({ groupName: Joi.string().required() }),
    query: groupThingsSchema,
  }),
  getThingsInGroup
);

// GET /assets/groups/:groupName/unregistered
router.get(
  "/groups/:groupName/unregistered",
  validationMiddleware({
    params: Joi.object({ groupName: Joi.string().required() }),
  }),
  getUnregisteredInGroup
);

export default router;