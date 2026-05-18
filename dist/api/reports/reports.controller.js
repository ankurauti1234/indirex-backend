"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewershipCSVReports = exports.getMemberwiseUnbridge = exports.getMemberwiseBridge = exports.getUnbridge = exports.getBridge = exports.getReport = void 0;
const reports_service_1 = require("../../services/reports/reports.service");
const response_1 = require("../../utils/response");
const service = new reports_service_1.ReportsService();
const getReport = async (req, res) => {
    try {
        const format = req.query.format || "json";
        if (format !== "json") {
            const ext = format === "xlsx" ? "xlsx" : format;
            res.setHeader("Content-Disposition", `attachment; filename="events-report.${ext}"`);
            res.setHeader("Content-Type", format === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : format === "csv"
                    ? "text/csv"
                    : "application/xml");
        }
        const data = await service.getReport(req.query, format);
        if (format === "json") {
            (0, response_1.sendSuccess)(res, data, "Report generated");
        }
        else if (typeof data === "string") {
            res.send(data);
        }
        else {
            res.send(data); // Buffer for xlsx
        }
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message || "Failed to generate report", 400);
    }
};
exports.getReport = getReport;
const getBridge = async (req, res) => {
    try {
        const format = req.query.format || "json";
        if (format !== "json") {
            const ext = format === "xlsx" ? "xlsx" : format;
            res.setHeader("Content-Disposition", `attachment; filename="bridge-report.${ext}"`);
            res.setHeader("Content-Type", format === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : format === "csv"
                    ? "text/csv"
                    : "application/xml");
        }
        const data = await service.getBridgeReports(req.query, format);
        if (format === "json") {
            (0, response_1.sendSuccess)(res, data, "Bridge report generated");
        }
        else if (typeof data === "string") {
            res.send(data);
        }
        else {
            res.send(data); // Buffer for xlsx
        }
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message || "Failed to generate bridge report", 400);
    }
};
exports.getBridge = getBridge;
const getUnbridge = async (req, res) => {
    try {
        const format = req.query.format || "json";
        if (format !== "json") {
            const ext = format === "xlsx" ? "xlsx" : format;
            res.setHeader("Content-Disposition", `attachment; filename="unbridge-report.${ext}"`);
            res.setHeader("Content-Type", format === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : format === "csv"
                    ? "text/csv"
                    : "application/xml");
        }
        const data = await service.getUnbridgeReports(req.query, format);
        if (format === "json") {
            (0, response_1.sendSuccess)(res, data, "Unbridge report generated");
        }
        else if (typeof data === "string") {
            res.send(data);
        }
        else {
            res.send(data); // Buffer for xlsx
        }
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message || "Failed to generate unbridge report", 400);
    }
};
exports.getUnbridge = getUnbridge;
const getMemberwiseBridge = async (req, res) => {
    try {
        const format = req.query.format || "json";
        if (format !== "json") {
            const ext = format === "xlsx" ? "xlsx" : format;
            res.setHeader("Content-Disposition", `attachment; filename="memberwise-bridge-report.${ext}"`);
            res.setHeader("Content-Type", format === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : format === "csv"
                    ? "text/csv"
                    : "application/xml");
        }
        const data = await service.getMemberwiseBridgeReports(req.query, format);
        if (format === "json") {
            (0, response_1.sendSuccess)(res, data, "Memberwise Bridge report generated");
        }
        else if (typeof data === "string") {
            res.send(data);
        }
        else {
            res.send(data);
        }
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message || "Failed to generate memberwise bridge report", 400);
    }
};
exports.getMemberwiseBridge = getMemberwiseBridge;
const getMemberwiseUnbridge = async (req, res) => {
    try {
        const format = req.query.format || "json";
        if (format !== "json") {
            const ext = format === "xlsx" ? "xlsx" : format;
            res.setHeader("Content-Disposition", `attachment; filename="memberwise-unbridge-report.${ext}"`);
            res.setHeader("Content-Type", format === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : format === "csv"
                    ? "text/csv"
                    : "application/xml");
        }
        const data = await service.getMemberwiseUnbridgeReports(req.query, format);
        if (format === "json") {
            (0, response_1.sendSuccess)(res, data, "Memberwise Unbridge report generated");
        }
        else if (typeof data === "string") {
            res.send(data);
        }
        else {
            res.send(data);
        }
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message || "Failed to generate memberwise unbridge report", 400);
    }
};
exports.getMemberwiseUnbridge = getMemberwiseUnbridge;
const getViewershipCSVReports = async (req, res) => {
    try {
        const data = await service.getViewershipCSVReports({
            date_label: req.query.date_label?.toString(),
            month: req.query.month?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 31,
        });
        return (0, response_1.sendSuccess)(res, data.reports, "Viewership CSV reports fetched", 200, {
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            totalPages: data.pagination.pages,
        });
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message || "Failed to fetch viewership CSV reports", 500);
    }
};
exports.getViewershipCSVReports = getViewershipCSVReports;
//# sourceMappingURL=reports.controller.js.map