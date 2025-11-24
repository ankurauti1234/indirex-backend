import * as dotenv from "dotenv";
dotenv.config();

export const env = {
  // ── Server ─────────────────────────────────────
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  // ── JWT ───────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET ?? "super-strong-jwt-secret-change-me",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ?? "super-strong-refresh-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  jwtRefreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",

  // ── DB ────────────────────────────────────────
  postgres: {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
  },

  // ── Redis ─────────────────────────────────────
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  // ── Email (nodemailer) ───────────────────────
  smtp: {
    host: process.env.SMTP_HOST ?? "smtp.example.com",
    port: Number(process.env.SMTP_PORT) ?? 587,
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.FROM_EMAIL ?? "no-reply@example.com",
  },

  // ── AWS ───────────────────────────────────────
  aws: {
    region: process.env.AWS_REGION ?? "ap-south-1",
    accountId: process.env.AWS_ACCOUNT_ID ?? "",
    defaultBucket: process.env.DEFAULT_S3_BUCKET ?? "",
    awsIotEndpoint: process.env.AWS_IOT_ENDPOINT ?? "",
  },

  // ── Misc ──────────────────────────────────────
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  cookieSecret: process.env.COOKIE_SECRET ?? "another-strong-cookie-secret",
};
