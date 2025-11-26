"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAccountCreationEmail = void 0;
// src/utils/email.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtp.host,
    port: env_1.env.smtp.port,
    secure: false,
    auth: {
        user: env_1.env.smtp.user,
        pass: env_1.env.smtp.pass,
    },
});
const sendAccountCreationEmail = async (to, name, tempPassword) => {
    const templatePath = path_1.default.join(__dirname, "../templates/email/account-creation.hbs");
    const source = await (0, promises_1.readFile)(templatePath, "utf-8");
    const template = handlebars_1.default.compile(source);
    const html = template({
        name,
        email: to,
        tempPassword,
        appUrl: env_1.env.appUrl,
    });
    await transporter.sendMail({
        from: `"Meter Monitoring" <${env_1.env.smtp.from}>`,
        to,
        subject: "Your account has been created",
        html,
    });
};
exports.sendAccountCreationEmail = sendAccountCreationEmail;
