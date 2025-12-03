import { Router } from "express";
import {
  getHouseholds,
  updatePreassignedContact,
  uploadHouseholdMembers,
  deleteHouseholdMember,
} from "./household.controller";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  listHouseholdsSchema,
  updateContactSchema,
  uploadMembersSchema,
} from "./household.validation";
import Joi from "joi";

const router = Router();

router.use(protect, authorize(UserRole.ADMIN, UserRole.DEVELOPER));

// GET /api/households
router.get("/", validationMiddleware({ query: listHouseholdsSchema }), getHouseholds);

// PATCH /api/households/:householdId/contact
router.patch(
  "/:householdId/contact",
  validationMiddleware({
    params: Joi.object({ householdId: Joi.string().uuid().required() }),
    body: updateContactSchema,
  }),
  updatePreassignedContact
);

// POST /api/households/members/upload
router.post(
  "/members/upload",
  validationMiddleware({
    body: uploadMembersSchema,
  }),
  uploadHouseholdMembers
);

// DELETE /api/households/members/:memberId
router.delete("/members/:memberId", deleteHouseholdMember);

export default router;