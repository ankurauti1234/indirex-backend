// src/api/alerts/alerts.controller.ts
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";
import {
  getInactiveMeters,
  getInactiveCount,
  getAllActiveAlerts,
  getRecipients,
  addRecipient,
  removeRecipient,
  getSettings,
  updateSettings,
  runInactivityCheck,
  sendInactivityReport,
  generateInactivityExcel,
} from "../../services/alerts";
import {
  addRecipientSchema,
  updateSettingsSchema,
  paginationSchema,
} from "./alerts.validation";

// ─── Inactivity Alerts ───────────────────────────────────────────

/** GET /api/v1/alerts/inactivity */
export const listInactiveMeters = async (req: Request, res: Response) => {
  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) return sendError(res, error.message, 400);

    const result = await getInactiveMeters({
      page: value.page,
      limit: value.limit,
      device_id: value.device_id || undefined,
    });

    return sendSuccess(res, result.data, "Inactive meters fetched", 200, result.pagination);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

/** GET /api/v1/alerts/inactivity/count */
export const inactiveCount = async (_req: Request, res: Response) => {
  try {
    const count = await getInactiveCount();
    return sendSuccess(res, { count }, "Inactive meter count fetched");
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

/** GET /api/v1/alerts/inactivity/export */
export const exportInactiveMeters = async (_req: Request, res: Response) => {
  try {
    const alerts = await getAllActiveAlerts();
    if (alerts.length === 0) {
      return sendError(res, "No inactive meters to export", 404);
    }

    const buffer = generateInactivityExcel(alerts);
    const dateStr = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Inactive_Meters_Report_${dateStr}.xlsx`
    );
    return res.send(buffer);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

/** POST /api/v1/alerts/inactivity/check */
export const triggerCheck = async (_req: Request, res: Response) => {
  try {
    const result = await runInactivityCheck();
    return sendSuccess(res, result, "Inactivity check completed");
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

/** POST /api/v1/alerts/inactivity/send-email */
export const triggerEmail = async (_req: Request, res: Response) => {
  try {
    const result = await sendInactivityReport();
    if (!result.sent) {
      return sendError(
        res,
        "Email not sent — no recipients or no inactive meters",
        400
      );
    }
    return sendSuccess(res, result, "Inactivity report email sent");
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

// ─── Email Recipients ────────────────────────────────────────────

/** GET /api/v1/alerts/recipients */
export const listRecipients = async (_req: Request, res: Response) => {
  try {
    const data = await getRecipients();
    return sendSuccess(res, data, "Recipients fetched");
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

/** POST /api/v1/alerts/recipients */
export const createRecipient = async (req: Request, res: Response) => {
  try {
    const { error, value } = addRecipientSchema.validate(req.body);
    if (error) return sendError(res, error.message, 400);

    const recipient = await addRecipient(value.email, value.name);
    return sendSuccess(res, recipient, "Recipient added", 201);
  } catch (e: any) {
    const status = e.message.includes("already exists") ? 409 : 500;
    return sendError(res, e.message, status);
  }
};

/** DELETE /api/v1/alerts/recipients/:id */
export const deleteRecipient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return sendError(res, "Invalid recipient ID", 400);

    await removeRecipient(id);
    return sendSuccess(res, null, "Recipient removed");
  } catch (e: any) {
    const status = e.message.includes("not found") ? 404 : 500;
    return sendError(res, e.message, status);
  }
};

// ─── Settings ────────────────────────────────────────────────────

/** GET /api/v1/alerts/settings */
export const getAlertSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    return sendSuccess(res, settings, "Alert settings fetched");
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};

/** PUT /api/v1/alerts/settings */
export const updateAlertSettings = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateSettingsSchema.validate(req.body);
    if (error) return sendError(res, error.message, 400);

    const settings = await updateSettings(value);
    return sendSuccess(res, settings, "Alert settings updated");
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
};
