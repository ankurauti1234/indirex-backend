"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const events_1 = __importDefault(require("./events"));
const ota_1 = __importDefault(require("./ota"));
const remote_access_1 = __importDefault(require("./remote-access"));
const reports_1 = __importDefault(require("./reports"));
const assets_1 = __importDefault(require("./assets"));
const household_1 = __importDefault(require("./household"));
const decommission_1 = __importDefault(require("./decommission"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/events", events_1.default);
router.use("/ota", ota_1.default);
router.use("/remote-access", remote_access_1.default);
router.use("/reports", reports_1.default);
router.use("/assets", assets_1.default);
router.use("/households", household_1.default);
router.use("/decommission", decommission_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map