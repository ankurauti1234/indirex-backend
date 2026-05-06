// src/api/alerts/alerts.routes.ts
import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import {
  listInactiveMeters,
  inactiveCount,
  exportInactiveMeters,
  triggerCheck,
  triggerEmail,
  listRecipients,
  createRecipient,
  deleteRecipient,
  getAlertSettings,
  updateAlertSettings,
} from "./alerts.controller";

const router = Router();

router.use(protect);

// Inactivity alerts
router.get("/inactivity", listInactiveMeters);
router.get("/inactivity/count", inactiveCount);
router.get("/inactivity/export", exportInactiveMeters);
router.post("/inactivity/check", triggerCheck);
router.post("/inactivity/send-email", triggerEmail);

// Email recipients
router.get("/recipients", listRecipients);
router.post("/recipients", createRecipient);
router.delete("/recipients/:id", deleteRecipient);

// Settings
router.get("/settings", getAlertSettings);
router.put("/settings", updateAlertSettings);

export default router;
