"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = void 0;
const response_1 = require("../utils/response");
const validationMiddleware = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error)
                errors.push(...error.details.map(d => `[body] ${d.message}`));
        }
        // Validate query
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error)
                errors.push(...error.details.map(d => `[query] ${d.message}`));
        }
        // Validate params
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error)
                errors.push(...error.details.map(d => `[params] ${d.message}`));
        }
        if (errors.length > 0) {
            return (0, response_1.sendError)(res, errors.join(", "), 422);
        }
        next();
    };
};
exports.validationMiddleware = validationMiddleware;
//# sourceMappingURL=validation.middleware.js.map