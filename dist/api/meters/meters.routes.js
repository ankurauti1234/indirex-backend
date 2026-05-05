"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/meters/meters.routes.ts
const express_1 = require("express");
const meters_controller_1 = require("./meters.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// GET /api/v1/meters/stats
router.get("/stats", meters_controller_1.getMeterStats);
// GET /api/v1/meters/installed
router.get("/installed", meters_controller_1.getInstalledMeters);
exports.default = router;
//# sourceMappingURL=meters.routes.js.map