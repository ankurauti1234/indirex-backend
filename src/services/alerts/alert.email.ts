// src/services/alerts/alert.email.ts
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import { readFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";
import { env } from "../../config/env";
import { InactivityAlert } from "../../database/entities/InactivityAlert";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

/**
 * Generate an Excel buffer from the inactivity alerts data.
 */
export function generateInactivityExcel(
  alerts: InactivityAlert[]
): Buffer {
  const rows = alerts.map((a) => ({
    "Device ID": a.device_id,
    "HHID": a.hhid || "N/A",
    "Last Connectivity": a.lastEventAt
      ? new Date(a.lastEventAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      : "Never",
    "Inactive Since": new Date(a.detectedAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
    "Status": "Inactive",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r) => String((r as Record<string, string>)[key] || "").length)
    ) + 2,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inactive Meters");

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

/**
 * Send the inactivity alert email with an Excel attachment.
 */
export async function sendInactivityAlertEmail(
  toAddresses: string[],
  alerts: InactivityAlert[]
): Promise<void> {
  const templatePath = path.join(
    __dirname,
    "../../templates/email/inactivity-alert.hbs"
  );

  const source = await readFile(templatePath, "utf-8");
  const template = handlebars.compile(source);

  const html = template({
    count: alerts.length,
    checkTime: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
    appUrl: env.appUrl,
  });

  const excelBuffer = generateInactivityExcel(alerts);
  const dateStr = new Date().toISOString().slice(0, 10);

  try {
    await transporter.sendMail({
      from: `"Meter Monitoring" <${env.smtp.from}>`,
      to: toAddresses.join(", "),
      subject: `Inactivity Alert: ${alerts.length} Meter(s) Inactive — ${dateStr}`,
      html,
      attachments: [
        {
          filename: `Inactive_Meters_Report_${dateStr}.xlsx`,
          content: excelBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });
  } catch (error: any) {
    console.error("[InactivityEmail] Failed to send email:", error);
    throw error;
  }
}
