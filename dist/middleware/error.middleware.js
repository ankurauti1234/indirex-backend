"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const errorMiddleware = (err, _req, res, _next) => {
    console.error(err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Something went wrong";
    (0, response_1.sendError)(res, message, status, env_1.env.nodeEnv === "development" ? err.stack : undefined);
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map