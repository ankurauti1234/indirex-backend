"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/events/events.routes.ts
const express_1 = require("express");
const events_controller_1 = require("./events.controller");
const event_mapping_routes_1 = __importDefault(require("./event-mapping.routes"));
const meter_channels_routes_1 = __importDefault(require("./meter-channels.routes"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const events_validation_1 = require("./events.validation");
const joi_1 = __importDefault(require("joi"));
const event_service_1 = require("../../services/events/event.service"); // ← Static import
const router = (0, express_1.Router)();
// === Event Mapping CRUD ===
router.use("/mapping", event_mapping_routes_1.default);
// === Events ===
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.eventsQuerySchema }), events_controller_1.getEvents);
router.get("/type/:type", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ type: joi_1.default.number().required() }),
    query: events_validation_1.eventsQuerySchema,
}), events_controller_1.getEventsByType);
router.get("/alerts", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.eventsQuerySchema }), events_controller_1.getAlerts);
router.get("/alerts/device/:device_id", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ device_id: joi_1.default.string().required() }),
    query: events_validation_1.eventsQuerySchema,
}), events_controller_1.getAlertsByDevice);
router.use("/meter-channels", meter_channels_routes_1.default);
// === Debug endpoint (safe version) ===
router.get("/debug", async (_req, res) => {
    try {
        const eventService = new event_service_1.EventService();
        await eventService.debugTimestamps();
        res.send("Debug timestamps executed — check server console");
    }
    catch (err) {
        console.error("Debug failed:", err);
        res.status(500).send("Debug failed");
    }
});
exports.default = router;
//# sourceMappingURL=events.routes.js.map