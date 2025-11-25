"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
router.get("/debug", async (_req, res) => {
    await new (await Promise.resolve().then(() => __importStar(require("../../services/events/event.service")))).EventService().debugTimestamps();
    res.send("Check server console");
});
exports.default = router;
