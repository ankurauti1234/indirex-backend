// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import { sendError } from "../utils/response";

type ValidationSource = "body" | "query" | "params";

interface ValidationSchema {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
}

export const validationMiddleware = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) errors.push(...error.details.map(d => `[body] ${d.message}`));
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) errors.push(...error.details.map(d => `[query] ${d.message}`));
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) errors.push(...error.details.map(d => `[params] ${d.message}`));
    }

    if (errors.length > 0) {
      return sendError(res, errors.join(", "), 422);
    }

    next();
  };
};