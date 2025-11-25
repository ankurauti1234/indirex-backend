"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/events/meter-channels.routes.ts
const express_1 = require("express");
const meter_channels_controller_1 = require("./meter-channels.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const meter_channels_validation_1 = require("./meter-channels.validation");
const router = (0, express_1.Router)();
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: meter_channels_validation_1.meterChannelsQuerySchema }), meter_channels_controller_1.getMeterChannels);
exports.default = router;
