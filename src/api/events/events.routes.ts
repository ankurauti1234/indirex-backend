// src/api/events/events.routes.ts
import { Router } from "express";
import {
  getEvents,
  getEventsByType,
  getAlerts,
  getAlertsByDevice,
} from "./events.controller";
import eventMappingRouter from "./event-mapping.routes";
import meterChannelsRouter from "./meter-channels.routes";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { eventsQuerySchema } from "./events.validation";
import Joi from "joi";

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

router.use("/meter-channels", meterChannelsRouter);

router.get("/debug", async (_req, res) => {
  await new (await import("../../services/events/event.service")).EventService().debugTimestamps();
  res.send("Check server console");
});

export default router;