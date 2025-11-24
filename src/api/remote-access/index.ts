import { Router } from "express";
import remoteAccessRouter from "./remote-access.routes";

const router = Router();
router.use("/", remoteAccessRouter);

export default router;