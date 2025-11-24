// src/api/household/household.routes.ts
import { Router } from "express";
import { getHouseholds, updatePreassignedContact } from "./household.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  listHouseholdsSchema,
  updateContactSchema,
} from "./household.validation";
import Joi from "joi";

const router = Router();

router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

// GET /households
router.get("/", validationMiddleware({ query: listHouseholdsSchema }), getHouseholds);

// PATCH /households/:householdId/contact
router.patch(
  "/:householdId/contact",
  validationMiddleware({
    params: Joi.object({ householdId: Joi.string().uuid().required() }),
    body: updateContactSchema,
  }),
  updatePreassignedContact
);

export default router;