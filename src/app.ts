// src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import * as yaml from "yamljs";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import { AppDataSource } from "./database/connection";
import { createDbTunnel } from "./database/tunnel";
import apiRouter from "./api/index";
import { errorMiddleware } from "./middleware/error.middleware";
import { setupRemoteAccessWebSocket } from "./api/remote-access/remote-access.websocket";

import { env } from "./config/env";

const app = express();
const httpServer = createServer(app);

// ---------- Middleware ----------
app.use(helmet());

const allowedOrigins = env.cors.origins;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
app.use(cookieParser(env.cookie.secret));

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
const wss = new WebSocketServer({
  server: httpServer,
  path: "/ws/remote-access",
});
setupRemoteAccessWebSocket(wss);

// ---------- Bootstrap & Start ----------
async function bootstrap() {
  try {
    await createDbTunnel();
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    const port = env.port || 3000;
    httpServer.listen(port, () => {
      console.log(`Server + WebSocket listening on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the server when this module is the main entry point
if (require.main === module) {
  bootstrap();
}

// Optional: export for testing or external start
export const startServer = bootstrap;
export default app;