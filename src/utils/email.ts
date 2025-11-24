// src/utils/email.ts
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import { readFile } from "fs/promises";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendAccountCreationEmail = async (
  to: string,
  name: string,
  tempPassword: string
) => {
  // Read and compile template
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
    appUrl: process.env.APP_URL || "http://localhost:4000",
  });

  await transporter.sendMail({
    from: `"Meter Monitoring" <${process.env.FROM_EMAIL}>`,
    to,
    subject: "Your account has been created",
    html,
  });
};