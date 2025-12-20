"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
// src/app.ts
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yaml = __importStar(require("yamljs"));
const http_1 = require("http");
const ws_1 = require("ws");
const connection_1 = require("./database/connection");
const tunnel_1 = require("./database/tunnel");
const index_1 = __importDefault(require("./api/index"));
const error_middleware_1 = require("./middleware/error.middleware");
const remote_access_websocket_1 = require("./api/remote-access/remote-access.websocket");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ---------- Middleware ----------
app.use((0, helmet_1.default)());
const allowedOrigins = env_1.env.cors.origins;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)(env_1.env.cookie.secret));
// ---------- Swagger ----------
const swaggerDoc = yaml.load("./src/docs/swagger.yaml");
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDoc));
// ---------- API ----------
app.use("/api/v1", index_1.default);
// ---------- Health ----------
app.get("/health", (_req, res) => res.json({ success: true, msg: "OK" }));
// ---------- Error ----------
app.use(error_middleware_1.errorMiddleware);
// ---------- WebSocket ----------
const wss = new ws_1.WebSocketServer({
    server: httpServer,
    path: "/ws/remote-access",
});
(0, remote_access_websocket_1.setupRemoteAccessWebSocket)(wss);
// ---------- Bootstrap & Start ----------
async function bootstrap() {
    try {
        await (0, tunnel_1.createDbTunnel)();
        await connection_1.AppDataSource.initialize();
        console.log("Data Source has been initialized!");
        const port = env_1.env.port || 3000;
        httpServer.listen(port, () => {
            console.log(`Server + WebSocket listening on port ${port}`);
        });
    }
    catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}
// Start the server when this module is the main entry point
if (require.main === module) {
    bootstrap();
}
// Optional: export for testing or external start
exports.startServer = bootstrap;
exports.default = app;
//# sourceMappingURL=app.js.map