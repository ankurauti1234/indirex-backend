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
  getHouseholdVisualization,
  getWeeklyConnectivityReport,
  getDailyReport,
  getDailyReportRegions
} from "./events.controller";
import eventMappingRouter from "./event-mapping.routes";
import meterChannelsRouter from "./meter-channels.routes";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  eventsQuerySchema,
  liveMonitoringQuerySchema,
  viewershipQuerySchema,
  householdVisualizationQuerySchema,
  weeklyConnectivityQuerySchema,
} from "./events.validation";
import Joi from "joi";
import { EventService } from "../../services/events/event.service";

import { protect } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { UserRole } from "../../database/entities/User";
import { sendSuccess } from "../../utils/response";

const router = Router();

// Middleware to return empty data for viewer role on restricted routes
const restrictViewer = (emptyData: any) => (req: any, res: any, next: any) => {
  if (req.user?.role === UserRole.VIEWER) {
    return sendSuccess(res, emptyData, "Viewer Restricted Access");
  }
  next();
};

// Protect all routes
router.use(protect);

// === Event Mapping CRUD ===
router.use("/mapping", authorize(UserRole.ADMIN, UserRole.DEVELOPER), eventMappingRouter);

// === Events ===
router.get("/",
  validationMiddleware({ query: eventsQuerySchema }),
  restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  getEvents
);

router.get(
  "/type/:type",
  validationMiddleware({
    params: Joi.object({ type: Joi.number().required() }),
    query: eventsQuerySchema,
  }),
  restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  getEventsByType
);

router.get("/alerts",
  validationMiddleware({ query: eventsQuerySchema }),
  restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  getAlerts
);

router.get(
  "/alerts/device/:device_id",
  validationMiddleware({
    params: Joi.object({ device_id: Joi.string().required() }),
    query: eventsQuerySchema,
  }),
  restrictViewer({ events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  getAlertsByDevice
);

// === Live Monitoring & Viewership ===
router.get(
  "/live-monitoring",
  validationMiddleware({ query: liveMonitoringQuerySchema }),
  restrictViewer({ data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }),
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

router.get(
  "/household-visualization",
  validationMiddleware({ query: householdVisualizationQuerySchema }),
  restrictViewer({ data: [], pagination: { page: 1, limit: 500, total: 0, pages: 0 } }),
  getHouseholdVisualization
);

// === Weekly Connectivity Report ===
router.get(
  "/weekly-connectivity",
  validationMiddleware({ query: weeklyConnectivityQuerySchema }),
  restrictViewer({
    data: [],
    week_start: "",
    week_end: "",
    stats: { total_meters: 0, fully_connected: 0, partially_connected: 0, not_connected: 0, avg_connectivity_rate: 0 },
    pagination: { page: 1, limit: 25, total: 0, pages: 0 },
  }),
  getWeeklyConnectivityReport
);

router.use("/meter-channels",
  restrictViewer({ channels: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  meterChannelsRouter
);

router.get("/daily-report/regions", getDailyReportRegions);

router.get(
  "/daily-report",
  validationMiddleware({ query: viewershipQuerySchema }),
  getDailyReport
);
 
router.use("/meter-channels",
  restrictViewer({ channels: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
  meterChannelsRouter
);

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