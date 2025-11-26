"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const User_1 = require("../database/entities/User");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const protect = async (req, res, next) => {
    let token;
    // Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Check signed cookies
    else if (req.signedCookies?.access_token) {
        token = req.signedCookies.access_token;
    }
    if (!token) {
        return (0, response_1.sendError)(res, "Not authorized", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwt.secret);
        const user = await connection_1.AppDataSource.getRepository(User_1.User).findOneBy({
            id: decoded.id,
        });
        if (!user) {
            return (0, response_1.sendError)(res, "User no longer exists", 401);
        }
        req.user = user;
        return next();
    }
    catch (e) {
        return (0, response_1.sendError)(res, "Invalid token", 401);
    }
};
exports.protect = protect;
