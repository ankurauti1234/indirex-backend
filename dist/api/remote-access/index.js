"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const remote_access_routes_1 = __importDefault(require("./remote-access.routes"));
const router = (0, express_1.Router)();
router.use("/", remote_access_routes_1.default);
exports.default = router;
