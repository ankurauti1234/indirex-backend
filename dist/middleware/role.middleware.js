"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const response_1 = require("../utils/response");
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return (0, response_1.sendError)(res, "Forbidden", 403);
    }
    next();
};
exports.authorize = authorize;
//# sourceMappingURL=role.middleware.js.map