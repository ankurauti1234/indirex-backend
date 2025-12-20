"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnregisteredInGroup = exports.getThingsInGroup = exports.getThingGroups = exports.deleteMeter = exports.updateMeter = exports.getMeters = exports.uploadMeters = void 0;
const assets_service_1 = require("../../services/assets/assets.service");
const response_1 = require("../../utils/response");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const service = new assets_service_1.AssetsService();
exports.uploadMeters = [
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file)
                throw new Error("No file uploaded");
            const { groupName } = req.body;
            if (!groupName)
                throw new Error("groupName required");
            const result = await service.uploadMeters(req.file, groupName, req.user.id);
            (0, response_1.sendSuccess)(res, result, "Meters uploaded", 201);
        }
        catch (e) {
            (0, response_1.sendError)(res, e.message, 400);
        }
    },
];
const getMeters = async (req, res) => {
    try {
        const { page, limit, meterId, status, powerHATStatus, groupName, meterType } = req.query;
        const data = await service.getMeters({
            page: Number(page),
            limit: Number(limit),
            meterId: meterId,
            status: status,
            powerHATStatus: powerHATStatus,
            groupName: groupName,
            meterType: meterType,
        });
        (0, response_1.sendSuccess)(res, data, "Meters listed");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getMeters = getMeters;
const updateMeter = async (req, res) => {
    try {
        const { meterId } = req.params;
        const { meterType, assetSerialNumber, powerHATStatus } = req.body;
        const updated = await service.updateMeter(meterId, { meterType, assetSerialNumber, powerHATStatus });
        (0, response_1.sendSuccess)(res, updated, "Meter updated");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.updateMeter = updateMeter;
const deleteMeter = async (req, res) => {
    try {
        const { meterId } = req.params;
        await service.deleteMeter(meterId);
        (0, response_1.sendSuccess)(res, null, "Meter deleted");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.deleteMeter = deleteMeter;
const getThingGroups = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const data = await service.getThingGroups({ page: Number(page), limit: Number(limit) });
        (0, response_1.sendSuccess)(res, data, "Thing groups listed");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getThingGroups = getThingGroups;
const getThingsInGroup = async (req, res) => {
    try {
        const { groupName } = req.params;
        const { page, limit } = req.query;
        const data = await service.getThingsInGroup(groupName, { page: Number(page), limit: Number(limit) });
        (0, response_1.sendSuccess)(res, data, "Things in group");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getThingsInGroup = getThingsInGroup;
const getUnregisteredInGroup = async (req, res) => {
    try {
        const { groupName } = req.params;
        const data = await service.getUnregisteredInGroup(groupName);
        (0, response_1.sendSuccess)(res, data, "Unregistered things in group");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getUnregisteredInGroup = getUnregisteredInGroup;
//# sourceMappingURL=assets.controller.js.map