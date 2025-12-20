"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, msg = "Success", status = 200) => {
    const payload = { success: true, data, msg };
    return res.status(status).json(payload);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, msg = "Internal Server Error", status = 500, error) => {
    const payload = { success: false, msg, error };
    return res.status(status).json(payload);
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map