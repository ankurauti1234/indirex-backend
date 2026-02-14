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

// GET /api/households
router.get("/",
  restrictViewer({ households: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  validationMiddleware({ query: listHouseholdsSchema }),
  getHouseholds
);

// PATCH /api/households/:householdId/contact
router.patch(
  "/:householdId/contact",
  authorize(UserRole.ADMIN, UserRole.DEVELOPER),
  validationMiddleware({
    params: Joi.object({ householdId: Joi.string().uuid().required() }),
    body: updateContactSchema,
  }),
  updatePreassignedContact
);

// POST /api/households/members/upload
router.post(
  "/members/upload",
  authorize(UserRole.ADMIN, UserRole.DEVELOPER),
  validationMiddleware({
    body: uploadMembersSchema,
  }),
  uploadHouseholdMembers
);

// DELETE /api/households/members/:memberId
router.delete("/members/:memberId", authorize(UserRole.ADMIN, UserRole.DEVELOPER), deleteHouseholdMember);

export default router;