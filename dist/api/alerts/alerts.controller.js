"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertSettings = exports.getAlertSettings = exports.deleteRecipient = exports.createRecipient = exports.listRecipients = exports.triggerEmail = exports.triggerCheck = exports.exportInactiveMeters = exports.inactiveCount = exports.listInactiveMeters = void 0;
const response_1 = require("../../utils/response");
const alerts_1 = require("../../services/alerts");
const alerts_validation_1 = require("./alerts.validation");
// ─── Inactivity Alerts ───────────────────────────────────────────
/** GET /api/v1/alerts/inactivity */
const listInactiveMeters = async (req, res) => {
    try {
        const { error, value } = alerts_validation_1.paginationSchema.validate(req.query);
        if (error)
            return (0, response_1.sendError)(res, error.message, 400);
        const result = await (0, alerts_1.getInactiveMeters)({
            page: value.page,
            limit: value.limit,
            device_id: value.device_id || undefined,
            inactivity_filter: value.inactivity_filter || undefined,
        });
        return (0, response_1.sendSuccess)(res, result.data, "Inactive meters fetched", 200, result.pagination);
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.listInactiveMeters = listInactiveMeters;
/** GET /api/v1/alerts/inactivity/count */
const inactiveCount = async (_req, res) => {
    try {
        const count = await (0, alerts_1.getInactiveCount)();
        return (0, response_1.sendSuccess)(res, { count }, "Inactive meter count fetched");
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.inactiveCount = inactiveCount;
/** GET /api/v1/alerts/inactivity/export */
const exportInactiveMeters = async (_req, res) => {
    try {
        const alerts = await (0, alerts_1.getAllActiveAlerts)();
        if (alerts.length === 0) {
            return (0, response_1.sendError)(res, "No inactive meters to export", 404);
        }
        const buffer = (0, alerts_1.generateInactivityExcel)(alerts);
        const dateStr = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Inactive_Meters_Report_${dateStr}.xlsx`);
        return res.send(buffer);
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.exportInactiveMeters = exportInactiveMeters;
/** POST /api/v1/alerts/inactivity/check */
const triggerCheck = async (_req, res) => {
    try {
        const result = await (0, alerts_1.runInactivityCheck)();
        return (0, response_1.sendSuccess)(res, result, "Inactivity check completed");
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.triggerCheck = triggerCheck;
/** POST /api/v1/alerts/inactivity/send-email */
const triggerEmail = async (_req, res) => {
    try {
        const result = await (0, alerts_1.sendInactivityReport)();
        if (!result.sent) {
            return (0, response_1.sendError)(res, "Email not sent — no recipients or no inactive meters", 400);
        }
        return (0, response_1.sendSuccess)(res, result, "Inactivity report email sent");
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.triggerEmail = triggerEmail;
// ─── Email Recipients ────────────────────────────────────────────
/** GET /api/v1/alerts/recipients */
const listRecipients = async (_req, res) => {
    try {
        const data = await (0, alerts_1.getRecipients)();
        return (0, response_1.sendSuccess)(res, data, "Recipients fetched");
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.listRecipients = listRecipients;
/** POST /api/v1/alerts/recipients */
const createRecipient = async (req, res) => {
    try {
        const { error, value } = alerts_validation_1.addRecipientSchema.validate(req.body);
        if (error)
            return (0, response_1.sendError)(res, error.message, 400);
        const recipient = await (0, alerts_1.addRecipient)(value.email, value.name);
        return (0, response_1.sendSuccess)(res, recipient, "Recipient added", 201);
    }
    catch (e) {
        const status = e.message.includes("already exists") ? 409 : 500;
        return (0, response_1.sendError)(res, e.message, status);
    }
};
exports.createRecipient = createRecipient;
/** DELETE /api/v1/alerts/recipients/:id */
const deleteRecipient = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id || isNaN(id))
            return (0, response_1.sendError)(res, "Invalid recipient ID", 400);
        await (0, alerts_1.removeRecipient)(id);
        return (0, response_1.sendSuccess)(res, null, "Recipient removed");
    }
    catch (e) {
        const status = e.message.includes("not found") ? 404 : 500;
        return (0, response_1.sendError)(res, e.message, status);
    }
};
exports.deleteRecipient = deleteRecipient;
// ─── Settings ────────────────────────────────────────────────────
/** GET /api/v1/alerts/settings */
const getAlertSettings = async (_req, res) => {
    try {
        const settings = await (0, alerts_1.getSettings)();
        return (0, response_1.sendSuccess)(res, settings, "Alert settings fetched");
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getAlertSettings = getAlertSettings;
/** PUT /api/v1/alerts/settings */
const updateAlertSettings = async (req, res) => {
    try {
        const { error, value } = alerts_validation_1.updateSettingsSchema.validate(req.body);
        if (error)
            return (0, response_1.sendError)(res, error.message, 400);
        const settings = await (0, alerts_1.updateSettings)(value);
        return (0, response_1.sendSuccess)(res, settings, "Alert settings updated");
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.updateAlertSettings = updateAlertSettings;
//# sourceMappingURL=alerts.controller.js.map