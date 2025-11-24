import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, "Forbidden", 403);
    }
    next();
  };