// src/api/reports/reports.controller.ts
import { Request, Response } from "express";
import { ReportsService } from "../../services/reports/reports.service";
import { sendSuccess, sendError } from "../../utils/response";

const service = new ReportsService();

export const getReport = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as "json" | "csv" | "xlsx" | "xml") || "json";

    if (format !== "json") {
      const ext = format === "xlsx" ? "xlsx" : format;
      res.setHeader("Content-Disposition", `attachment; filename="events-report.${ext}"`);
      res.setHeader(
        "Content-Type",
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : format === "csv"
          ? "text/csv"
          : "application/xml"
      );
    }

    const data = await service.getReport(req.query as any, format as any);

    if (format === "json") {
      sendSuccess(res, data, "Report generated");
    } else if (typeof data === "string") {
      res.send(data);
    } else {
      res.send(data); // Buffer for xlsx
    }
  } catch (e: any) {
    sendError(res, e.message || "Failed to generate report", 400);
  }
};