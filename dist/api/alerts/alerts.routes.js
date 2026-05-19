"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/alerts/alerts.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const alerts_controller_1 = require("./alerts.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// Inactivity alerts
router.get("/inactivity", alerts_controller_1.listInactiveMeters);
router.get("/inactivity/count", alerts_controller_1.inactiveCount);
router.get("/inactivity/export", alerts_controller_1.exportInactiveMeters);
router.post("/inactivity/check", alerts_controller_1.triggerCheck);
router.post("/inactivity/send-email", alerts_controller_1.triggerEmail);
// Email recipients
router.get("/recipients", alerts_controller_1.listRecipients);
router.post("/recipients", alerts_controller_1.createRecipient);
router.delete("/recipients/:id", alerts_controller_1.deleteRecipient);
// Settings
router.get("/settings", alerts_controller_1.getAlertSettings);
router.put("/settings", alerts_controller_1.updateAlertSettings);
exports.default = router;
//# sourceMappingURL=alerts.routes.js.map