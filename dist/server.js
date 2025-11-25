"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
(0, app_1.startServer)().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
