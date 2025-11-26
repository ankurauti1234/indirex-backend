// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../database/connection";
import { User } from "../database/entities/User";
import { sendError } from "../utils/response";
import { env } from "../config/env";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check Authorization header
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check signed cookies
  else if (req.signedCookies?.access_token) {
    token = req.signedCookies.access_token;
  }

  if (!token) {
    return sendError(res, "Not authorized", 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as { id: string };

    const user = await AppDataSource.getRepository(User).findOneBy({
      id: decoded.id,
    });

    if (!user) {
      return sendError(res, "User no longer exists", 401);
    }

    req.user = user;
    return next();
  } catch (e) {
    return sendError(res, "Invalid token", 401);
  }
};
