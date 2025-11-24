import { Router } from "express";
import {
  login,
  changePassword,
  createUser,
  refreshToken,
  getMe,
  updateUser,
  deleteUser,
  getAllUsers,
} from "./auth.controller";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import {
  loginSchema,
  changePasswordSchema,
  createUserSchema,
  refreshTokenSchema,
  updateUserSchema,
  getUsersSchema,
} from "./auth.validation";
import Joi from "joi";

const router = Router();

/* Public */
router.post("/login", validationMiddleware({ body: loginSchema }), login);

router.post(
  "/refresh-token",
  validationMiddleware({ body: refreshTokenSchema }),
  refreshToken
);

/* Protected */
router.post(
  "/change-password",
  protect,
  validationMiddleware({ body: changePasswordSchema }),
  changePassword
);

router.get("/me", protect, getMe);

router.get(
  "/users",
  protect,
  authorize(UserRole.ADMIN),
  validationMiddleware({ query: getUsersSchema }),
  getAllUsers
);

/* Admin only */
router.post(
  "/create-user",
  protect,
  authorize(UserRole.ADMIN),
  validationMiddleware({ body: createUserSchema }),
  createUser
);

router.patch(
  "/users/:id",
  protect,
  authorize(UserRole.ADMIN),
  validationMiddleware({
    params: Joi.object({ id: Joi.number().required() }),
    body: updateUserSchema,
  }),
  updateUser
);

router.delete(
  "/users/:id",
  protect,
  authorize(UserRole.ADMIN),
  validationMiddleware({
    params: Joi.object({ id: Joi.number().required() }),
  }),
  deleteUser
);

export default router;
