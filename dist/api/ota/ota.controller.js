"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyJobs = exports.createJob = void 0;
const { env } = require("../../config/env");
const ota_service_1 = require("../../services/ota/ota.service");
const response_1 = require("../../utils/response");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    dest: "uploads/",
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/octet-stream" || file.mimetype.startsWith("application/") || file.mimetype.startsWith("text/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type"));
        }
    },
});
const service = new ota_service_1.OtaService();
exports.createJob = [
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file)
                throw new Error("No file uploaded");
            if (!req.user)
                throw new Error("Unauthorized");
            const { version, bucketName, thingGroupName, thingNames, downloadPath } = req.body;
            const job = await service.createOtaJob(req.file, req.user, {
                version,
                bucketName: bucketName || env.aws.defaultBucket,
                thingGroupName,
                thingNames,
                downloadPath,
            });
            (0, response_1.sendSuccess)(res, job, "OTA Job created", 201);
        }
        catch (e) {
            (0, response_1.sendError)(res, e.message, 400);
        }
    },
];
const getMyJobs = async (req, res) => {
    try {
        if (!req.user)
            throw new Error("Unauthorized");
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const data = await service.getJobsByUser(req.user.id, page, limit);
        (0, response_1.sendSuccess)(res, data, "Your OTA jobs");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.getMyJobs = getMyJobs;
