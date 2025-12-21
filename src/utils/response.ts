// src/utils/response.ts

import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  msg?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: any;
}

/**
 * Send a successful API response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  msg = "Success",
  status = 200,
  pagination?: ApiResponse["pagination"]
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    msg,
    data,
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(status).json(payload);
};

/**
 * Send an error API response
 */
export const sendError = (
  res: Response,
  msg = "Internal Server Error",
  status = 500,
  error?: any
): Response => {
  const payload: ApiResponse = {
    success: false,
    msg,
    error,
  };

  return res.status(status).json(payload);
};