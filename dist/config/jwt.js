"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
const getSecret = (secret, fallback) => {
    const s = secret ?? fallback;
    if (!s)
        throw new Error("JWT secret is missing");
    return s;
};
const getExpiresIn = (val, fallback) => {
    return (val ?? fallback);
};
const generateAccessToken = (payload) => {
    const secret = getSecret(env_1.env.jwt.secret, "fallback-jwt-secret-change-me");
    const options = {
        expiresIn: getExpiresIn(env_1.env.jwt.expiresIn, "1h"),
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const secret = getSecret(env_1.env.jwt.refreshSecret, "fallback-refresh-secret-change-me");
    const options = {
        expiresIn: getExpiresIn(env_1.env.jwt.refreshExpiresIn, "7d"),
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateRefreshToken = generateRefreshToken;
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.js.map