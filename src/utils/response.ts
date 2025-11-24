import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  msg?: string;
  error?: any;
}

export const sendSuccess = <T>(res: Response, data: T, msg = "Success", status = 200) => {
  const payload: ApiResponse<T> = { success: true, data, msg };
  return res.status(status).json(payload);
};

export const sendError = (res: Response, msg = "Internal Server Error", status = 500, error?: any) => {
  const payload: ApiResponse = { success: false, msg, error };
  return res.status(status).json(payload);
};