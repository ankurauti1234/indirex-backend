// src/utils/email.ts
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import { readFile } from "fs/promises";
import path from "path";
import { env } from "../config/env";

console.log(`Initializing SMTP with host: ${env.smtp.host}, user: ${env.smtp.user}`);

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export const sendAccountCreationEmail = async (
  to: string,
  name: string,
  tempPassword: string
) => {
  const templatePath = path.join(
    __dirname,
    "../templates/email/account-creation.hbs"
  );

  const source = await readFile(templatePath, "utf-8");
  const template = handlebars.compile(source);

  const html = template({
    name,
    email: to,
    tempPassword,
    appUrl: env.appUrl,
  });

  try {
    await transporter.sendMail({
      from: `"Meter Monitoring" <${env.smtp.from}>`,
      to,
      subject: "Your account has been created",
      html,
    });
  } catch (error: any) {
    console.error("Error sending account creation email:", error);
    throw error;
  }
};

export const sendNewPassword = async (to: string, tempPassword: string) => {
  const templatePath = path.join(
    __dirname,
    "../templates/email/account-creation.hbs"
  );

  const source = await readFile(templatePath, "utf-8");
  const template = handlebars.compile(source);

  const html = template({
    email: to,
    tempPassword,
    appUrl: env.appUrl,
  });

  try {
    await transporter.sendMail({
      from: `"Meter Monitoring" <${env.smtp.from}>`,
      to,
      subject: "Your New Password",
      html,
    });
  } catch (error: any) {
    console.error("Error sending new password email:", error);
    throw error;
  }
};
