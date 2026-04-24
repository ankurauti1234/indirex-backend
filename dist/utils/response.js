"use strict";
// src/utils/response.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
/**
 * Send a successful API response
 */
const sendSuccess = (res, data, msg = "Success", status = 200, pagination) => {
    const payload = {
        success: true,
        msg,
        data,
    };
    if (pagination) {
        payload.pagination = pagination;
    }
    return res.status(status).json(payload);
};
exports.sendSuccess = sendSuccess;
/**
 * Send an error API response
 */
const sendError = (res, msg = "Internal Server Error", status = 500, error) => {
    const payload = {
        success: false,
        msg,
        error,
    };
    return res.status(status).json(payload);
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map