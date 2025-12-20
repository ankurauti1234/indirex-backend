"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReport = void 0;
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
//# sourceMappingURL=reports.controller.js.map