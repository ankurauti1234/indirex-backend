import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";
import { env } from "../config/env";

export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Something went wrong";
  sendError(res, message, status, env.nodeEnv === "development" ? err.stack : undefined);
};