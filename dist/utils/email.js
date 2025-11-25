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
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendAccountCreationEmail = async (to, name, tempPassword) => {
    // Read and compile template
    const templatePath = path_1.default.join(__dirname, "../templates/email/account-creation.hbs");
    const source = await (0, promises_1.readFile)(templatePath, "utf-8");
    const template = handlebars_1.default.compile(source);
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
exports.sendAccountCreationEmail = sendAccountCreationEmail;
