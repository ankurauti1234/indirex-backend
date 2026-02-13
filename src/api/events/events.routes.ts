// src/api/events/events.routes.ts
import { Router } from "express";
import {
  getEvents,
  getEventsByType,
  getAlerts,
  getAlertsByDevice,
  getLiveMonitoring,
  getViewership,
  getConnectivityReport,
  getButtonPressedReport,
} from "./events.controller";
import eventMappingRouter from "./event-mapping.routes";
import meterChannelsRouter from "./meter-channels.routes";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  eventsQuerySchema,
  liveMonitoringQuerySchema,
  viewershipQuerySchema
} from "./events.validation";
import Joi from "joi";
import { EventService } from "../../services/events/event.service"; // ← Static import

const router = Router();

// === Event Mapping CRUD ===
router.use("/mapping", eventMappingRouter);

// === Events ===
router.get("/", validationMiddleware({ query: eventsQuerySchema }), getEvents);

router.get(
  "/type/:type",
  validationMiddleware({
    params: Joi.object({ type: Joi.number().required() }),
    query: eventsQuerySchema,
  }),
  getEventsByType
);

router.get("/alerts", validationMiddleware({ query: eventsQuerySchema }), getAlerts);

router.get(
  "/alerts/device/:device_id",
  validationMiddleware({
    params: Joi.object({ device_id: Joi.string().required() }),
    query: eventsQuerySchema,
  }),
  getAlertsByDevice
);

// === Live Monitoring & Viewership ===
router.get(
  "/live-monitoring",
  validationMiddleware({ query: liveMonitoringQuerySchema }),
  getLiveMonitoring
);

router.get(
  "/viewership",
  validationMiddleware({ query: viewershipQuerySchema }),
  getViewership
);

router.get(
  "/connectivity-report",
  validationMiddleware({ query: viewershipQuerySchema }),
  getConnectivityReport
);

router.get(
  "/button-pressed-report",
  validationMiddleware({ query: viewershipQuerySchema }),
  getButtonPressedReport
);

router.use("/meter-channels", meterChannelsRouter);

// === Debug endpoint (safe version) ===
router.get("/debug", async (_req, res) => {
  try {
    const eventService = new EventService();
    await eventService.debugTimestamps();
    res.send("Debug timestamps executed — check server console");
  } catch (err) {
    console.error("Debug failed:", err);
    res.status(500).send("Debug failed");
  }
});

export default router;