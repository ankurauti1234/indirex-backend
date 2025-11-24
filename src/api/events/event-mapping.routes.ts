// src/api/events/event-mapping.routes.ts
import { Router } from "express";
import {
  getEventMappings,
  getEventMapping,
  createEventMapping,
  updateEventMapping,
  deleteEventMapping,
} from "./event-mapping.controller";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  createEventMappingSchema,
  updateEventMappingSchema,
} from "./event-mapping.validation";
import Joi from "joi";

const router = Router();

router.get("/", getEventMappings);

router.get(
  "/:id",
  validationMiddleware({
    params: Joi.object({ id: Joi.number().integer().required() }),
  }),
  getEventMapping
);

router.post(
  "/",
  validationMiddleware({ body: createEventMappingSchema }),
  createEventMapping
);

router.patch(
  "/:id",
  validationMiddleware({
    params: Joi.object({ id: Joi.number().integer().required() }),
    body: updateEventMappingSchema,
  }),
  updateEventMapping
);

router.delete(
  "/:id",
  validationMiddleware({
    params: Joi.object({ id: Joi.number().integer().required() }),
  }),
  deleteEventMapping
);

export default router;