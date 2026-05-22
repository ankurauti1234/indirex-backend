"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInactivityExcel = generateInactivityExcel;
exports.sendInactivityAlertEmail = sendInactivityAlertEmail;
// src/services/alerts/alert.email.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const XLSX = __importStar(require("xlsx"));
const env_1 = require("../../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtp.host,
    port: env_1.env.smtp.port,
    secure: false,
    auth: {
        user: env_1.env.smtp.user,
        pass: env_1.env.smtp.pass,
    },
});
/**
 * Format a duration in milliseconds into a human-readable string like "3d 4h 12m".
 */
function formatDuration(ms) {
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0)
        parts.push(`${minutes}m`);
    return parts.join(" ");
}
/**
 * Generate an Excel buffer from the inactivity alerts data.
 * Columns match the UI page: Device ID, HHID, Last Event Sent, Inactive For, Detected At
 */
function generateInactivityExcel(alerts) {
    const now = new Date();
    const rows = alerts.map((a) => {
        const inactiveDuration = a.lastEventAt
            ? formatDuration(now.getTime() - new Date(a.lastEventAt).getTime())
            : "Never connected";
        return {
            "Device ID": a.device_id,
            "HHID": a.hhid || "N/A",
            "Last Event Sent": a.lastEventAt
                ? new Date(a.lastEventAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                })
                : "Never",
            "Inactive For": inactiveDuration,
            "Detected At": new Date(a.detectedAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            }),
        };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...rows.map((r) => String(r[key] || "").length)) + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inactive Meters");
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
/**
 * Send the inactivity alert email with an Excel attachment.
 */
async function sendInactivityAlertEmail(toAddresses, alerts) {
    const templatePath = path_1.default.join(__dirname, "../../templates/email/inactivity-alert.hbs");
    const source = await (0, promises_1.readFile)(templatePath, "utf-8");
    const template = handlebars_1.default.compile(source);
    const html = template({
        count: alerts.length,
        checkTime: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
        appUrl: env_1.env.appUrl,
    });
    const excelBuffer = generateInactivityExcel(alerts);
    const dateStr = new Date().toISOString().slice(0, 10);
    try {
        await transporter.sendMail({
            from: `"Meter Monitoring" <${env_1.env.smtp.from}>`,
            to: toAddresses.join(", "),
            subject: `Inactivity Alert: ${alerts.length} Meter(s) Inactive — ${dateStr}`,
            html,
            attachments: [
                {
                    filename: `Inactive_Meters_Report_${dateStr}.xlsx`,
                    content: excelBuffer,
                    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            ],
        });
    }
    catch (error) {
        console.error("[InactivityEmail] Failed to send email:", error);
        throw error;
    }
}
//# sourceMappingURL=alert.email.js.map