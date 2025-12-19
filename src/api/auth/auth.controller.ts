// src/api/auth/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../../services/auth/auth.service";
import { sendSuccess, sendError } from "../../utils/response";
import { UserRole } from "../../database/entities/User";

const service = new AuthService();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(email,password)
    const data = await service.login(email, password, res);
    console.log(data)
    sendSuccess(res, data, "Logged in");
    console.log("Logged in")
  } catch (e: any) {
    sendError(res, e.message, 401);
    console.log("err login")
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!req.user) throw new Error("Unauthorized");
    await service.changePassword(req.user.id, oldPassword, newPassword);
    sendSuccess(res, null, "Password updated");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body;
    const data = await service.createUserByAdmin({ email, name, role });
    sendSuccess(res, data, "User created – email sent", 201);
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    let token = req.signedCookies?.refresh_token;
    if (!token && req.body.refreshToken) token = req.body.refreshToken;
    if (!token) throw new Error("Refresh token required");

    const data = await service.refreshToken(token, res);
    sendSuccess(res, data, "Token refreshed");
  } catch (e: any) {
    sendError(res, e.message, 401);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");
    const user = await service.getUserById(req.user.id);
    sendSuccess(res, { user }, "User profile");
  } catch (e: any) {
    sendError(res, e.message, 404);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // UUID string
    const { name, role } = req.body;
    const updated = await service.updateUser(userId, { name, role });
    sendSuccess(res, updated, "User updated");
  } catch (e: any) {
    sendError(res, e.message, 400);
  } 
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; // UUID string
    const result = await service.deleteUser(userId);
    sendSuccess(res, result, "User deleted", 200);
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const data = await service.getAllUsers({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      role: role as UserRole | undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "ASC" | "DESC",
    });

    sendSuccess(res, data, "Users retrieved successfully");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const createNewPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await service.forgotPassword({ email });
    sendSuccess(res, null, "Password reset email sent");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};
