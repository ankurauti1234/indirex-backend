import { Router } from "express";
import eventsRouter from "./events.routes";

const router = Router();
router.use("/", eventsRouter);

export default router;