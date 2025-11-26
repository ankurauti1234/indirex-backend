import * as dotenv from "dotenv";
dotenv.config();

const isDev = process.env.NODE_ENV === "development";

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  appUrl: isDev
    ? "http://localhost:3000"
    : "https://indirex.io",

  postgres: {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  },

  cookie: {
    secret: process.env.COOKIE_SECRET!,
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 604800000,
  },

  smtp: {
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: process.env.FROM_EMAIL!,
  },

  aws: {
    region: process.env.AWS_REGION ?? "ap-south-1",
    accountId: process.env.AWS_ACCOUNT_ID ?? "",
    defaultBucket: process.env.DEFAULT_S3_BUCKET ?? "",
    iotEndpoint: process.env.AWS_IOT_ENDPOINT ?? "",
  },

  cors: {
    origins: (() => {
      const raw = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
        : [];

      if (isDev) {
        if (!raw.includes("http://localhost:3000")) {
          raw.push("http://localhost:3000");
        }
        return raw;
      }

      return raw.filter(o => o !== "http://localhost:3000");
    })(),
  },
};
