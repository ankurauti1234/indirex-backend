"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/config/env.ts
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const isDev = process.env.NODE_ENV === "development";
exports.env = {
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV || "development",
    appUrl: isDev
        ? "http://localhost:3000"
        : "https://indirex.io",
    postgres: {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    },
    // New: SSH Tunnel Config
    ssh: {
        enabled: process.env.USE_SSH_TUNNEL === "false",
        host: process.env.SSH_HOST,
        port: Number(process.env.SSH_PORT) || 22,
        user: process.env.SSH_USER,
        keyPath: process.env.SSH_KEY_PATH,
        localPort: Number(process.env.LOCAL_TUNNEL_PORT) || 5433,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
    },
    cookie: {
        secret: process.env.COOKIE_SECRET,
        maxAge: Number(process.env.COOKIE_MAX_AGE) || 604800000,
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.FROM_EMAIL,
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
//# sourceMappingURL=env.js.map