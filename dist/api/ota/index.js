"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ota_routes_1 = __importDefault(require("./ota.routes"));
const router = (0, express_1.Router)();
router.use("/", ota_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map