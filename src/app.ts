// src/app.ts
import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import * as yaml from "yamljs";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { AppDataSource } from "./database/connection";
import apiRouter from "./api/index";
import { errorMiddleware } from "./middleware/error.middleware";
import { setupRemoteAccessWebSocket } from "./api/remote-access/remote-access.websocket";

const app = express();
const httpServer = createServer(app);

// ---------- Middleware ----------
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map(o => o.trim()) || [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile app / curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ---------- Swagger ----------
const swaggerDoc = yaml.load("./src/docs/swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ---------- API ----------
app.use("/api/v1", apiRouter);

// ---------- Health ----------
app.get("/health", (_req, res) => res.json({ success: true, msg: "OK" }));

// ---------- Error ----------
app.use(errorMiddleware);

// ---------- WebSocket ----------
const wss = new WebSocketServer({ server: httpServer, path: "/ws/remote-access" });
setupRemoteAccessWebSocket(wss);

// ---------- Export ----------
export const startServer = async () => {
  await AppDataSource.initialize();
  console.log("Data Source has been initialized!");
  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => console.log(`Server + WS listening on ${port}`));
};

export default app;