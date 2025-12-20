"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/events/event-mapping.routes.ts
const express_1 = require("express");
const event_mapping_controller_1 = require("./event-mapping.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const event_mapping_validation_1 = require("./event-mapping.validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: event_mapping_validation_1.eventMappingFilterSchema }), event_mapping_controller_1.getEventMappings);
router.get("/:id", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ id: joi_1.default.number().integer().required() }),
}), event_mapping_controller_1.getEventMapping);
router.post("/", (0, validation_middleware_1.validationMiddleware)({ body: event_mapping_validation_1.createEventMappingSchema }), event_mapping_controller_1.createEventMapping);
router.patch("/:id", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ id: joi_1.default.number().integer().required() }),
    body: event_mapping_validation_1.updateEventMappingSchema,
}), event_mapping_controller_1.updateEventMapping);
router.delete("/:id", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ id: joi_1.default.number().integer().required() }),
}), event_mapping_controller_1.deleteEventMapping);
exports.default = router;
//# sourceMappingURL=event-mapping.routes.js.map