// src/api/events/meter-channels.routes.ts
import { Router } from "express";
import { getMeterChannels } from "./meter-channels.controller";
import { validationMiddleware } from "../../middleware/validation.middleware";
import { meterChannelsQuerySchema } from "./meter-channels.validation";

const router = Router();

router.get(
  "/",
  validationMiddleware({ query: meterChannelsQuerySchema }),
  getMeterChannels
);

export default router;