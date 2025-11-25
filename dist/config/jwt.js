"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
/* ------------------------------------------------------------------ */
/*  Helper – guarantees the secret is a valid jwt.Secret               */
/* ------------------------------------------------------------------ */
const getSecret = (secret, fallback) => {
    const s = secret ?? fallback;
    if (!s)
        throw new Error("JWT secret is missing");
    return s;
};
/* ------------------------------------------------------------------ */
/*  Helper – safely cast expiresIn to valid SignOptions type           */
/* ------------------------------------------------------------------ */
const getExpiresIn = (val, fallback) => {
    // jsonwebtoken accepts number or "1h", "7d", etc.
    return (val ?? fallback);
};
/* ------------------------------------------------------------------ */
/*  Access token (short-lived)                                         */
/* ------------------------------------------------------------------ */
const generateAccessToken = (payload) => {
    const secret = getSecret(env_1.env.jwtSecret, "fallback-jwt-secret-change-me");
    const options = { expiresIn: getExpiresIn(env_1.env.jwtExpiresIn, "1h") };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateAccessToken = generateAccessToken;
/* ------------------------------------------------------------------ */
/*  Refresh token (long-lived)                                         */
/* ------------------------------------------------------------------ */
const generateRefreshToken = (payload) => {
    const secret = getSecret(env_1.env.jwtRefreshSecret, "fallback-refresh-secret-change-me");
    const options = { expiresIn: getExpiresIn(env_1.env.jwtRefreshExpiresIn, "7d") };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateRefreshToken = generateRefreshToken;
/* ------------------------------------------------------------------ */
/*  Verify any token                                                   */
/* ------------------------------------------------------------------ */
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
