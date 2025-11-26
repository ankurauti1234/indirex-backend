// src/utils/email.ts
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import { readFile } from "fs/promises";
import path from "path";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false,
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

  await transporter.sendMail({
    from: `"Meter Monitoring" <${env.smtp.from}>`,
    to,
    subject: "Your account has been created",
    html,
  });
};
