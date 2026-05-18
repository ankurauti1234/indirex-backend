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
const event_service_1 = require("../../services/events/event.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
// Middleware to return empty data for viewer role on restricted routes
const restrictViewer = (emptyData) => (req, res, next) => {
    if (req.user?.role === User_1.UserRole.VIEWER) {
        return (0, response_1.sendSuccess)(res, emptyData, "Viewer Restricted Access");
    }
    next();
};
// Protect all routes
router.use(auth_middleware_1.protect);
// === Event Mapping CRUD ===
router.use("/mapping", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER), event_mapping_routes_1.default);
// === Events ===
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.eventsQuerySchema }), restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), events_controller_1.getEvents);
router.get("/type/:type", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ type: joi_1.default.number().required() }),
    query: events_validation_1.eventsQuerySchema,
}), restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), events_controller_1.getEventsByType);
router.get("/alerts", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.eventsQuerySchema }), restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), events_controller_1.getAlerts);
router.get("/alerts/device/:device_id", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ device_id: joi_1.default.string().required() }),
    query: events_validation_1.eventsQuerySchema,
}), restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), events_controller_1.getAlertsByDevice);
// === Live Monitoring & Viewership ===
router.get("/live-monitoring", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.liveMonitoringQuerySchema }), restrictViewer({ data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }), events_controller_1.getLiveMonitoring);
router.get("/viewership", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.viewershipQuerySchema }), events_controller_1.getViewership);
router.get("/connectivity-report", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.viewershipQuerySchema }), events_controller_1.getConnectivityReport);
router.get("/button-pressed-report", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.viewershipQuerySchema }), events_controller_1.getButtonPressedReport);
router.get("/household-visualization", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.householdVisualizationQuerySchema }), restrictViewer({ data: [], pagination: { page: 1, limit: 500, total: 0, pages: 0 } }), events_controller_1.getHouseholdVisualization);
// === Weekly Connectivity Report ===
router.get("/weekly-connectivity", (0, validation_middleware_1.validationMiddleware)({ query: events_validation_1.weeklyConnectivityQuerySchema }), restrictViewer({
    data: [],
    week_start: "",
    week_end: "",
    stats: { total_meters: 0, fully_connected: 0, partially_connected: 0, not_connected: 0, avg_connectivity_rate: 0 },
    pagination: { page: 1, limit: 25, total: 0, pages: 0 },
}), events_controller_1.getWeeklyConnectivityReport);
router.use("/meter-channels", restrictViewer({ channels: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), meter_channels_routes_1.default);
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