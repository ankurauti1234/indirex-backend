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
exports.OtaService = void 0;
// src/services/ota/ota.service.ts
const connection_1 = require("../../database/connection");
const OtaJob_1 = require("../../database/entities/OtaJob");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const env_1 = require("../../config/env");
const typeorm_1 = require("typeorm");
const s3 = new aws_sdk_1.default.S3({ region: env_1.env.aws.region });
const iot = new aws_sdk_1.default.Iot({ region: env_1.env.aws.region });
class OtaService {
    constructor() {
        this.repo = connection_1.AppDataSource.getRepository(OtaJob_1.OtaJob);
    }
    async uploadToS3(bucket, key, body, contentType) {
        const result = await s3
            .upload({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
            .promise();
        return result.Location;
    }
    async createIotJob(s3Uri, targets) {
        return await iot
            .createJob({
            jobId: `job-${(0, uuid_1.v4)().replace(/-/g, "")}`,
            targets,
            documentSource: s3Uri,
        })
            .promise();
    }
    async createOtaJob(file, user, payload) {
        const { version, bucketName, thingGroupName, thingNames, downloadPath } = payload;
        if (!downloadPath?.trim())
            throw new Error("downloadPath required");
        const targets = [];
        const region = env_1.env.aws.region;
        const accountId = env_1.env.aws.accountId || "*";
        if (thingGroupName) {
            targets.push(`arn:aws:iot:${region}:${accountId}:thinggroup/${thingGroupName}`);
        }
        if (thingNames) {
            thingNames
                .split(",")
                .map((n) => n.trim())
                .filter((n) => n)
                .forEach((name) => {
                targets.push(`arn:aws:iot:${region}:${accountId}:thing/${name}`);
            });
        }
        if (targets.length === 0)
            throw new Error("No valid targets");
        const fileBuffer = fs.readFileSync(file.path);
        const ext = path.extname(file.originalname);
        const updateKey = `updates/${(0, uuid_1.v4)()}${ext}`;
        const jobKey = `job-documents/${(0, uuid_1.v4)()}-job.json`;
        const updateUrl = await this.uploadToS3(bucketName, updateKey, fileBuffer, file.mimetype);
        const jobDoc = {
            operation: "download-file",
            url: updateUrl,
            path: downloadPath.trim(),
        };
        const jobS3Location = await this.uploadToS3(bucketName, jobKey, Buffer.from(JSON.stringify(jobDoc, null, 2)), "application/json");
        const jobResult = await this.createIotJob(`s3://${bucketName}/${jobKey}`, targets);
        const otaJob = this.repo.create({
            version,
            fileName: file.originalname,
            s3KeyUpdate: updateKey,
            s3UrlUpdate: updateUrl,
            s3KeyJobDoc: jobKey,
            s3UrlJobDoc: jobS3Location,
            downloadPath: downloadPath.trim(),
            targets,
            jobId: jobResult.jobId,
            jobArn: jobResult.jobArn,
            status: OtaJob_1.OtaJobStatus.PENDING,
            userId: user.id,
        });
        await this.repo.save(otaJob);
        fs.unlinkSync(file.path);
        return otaJob;
    }
    async getJobsByUser(userId, page = 1, limit = 10, search // ← new optional parameter
    ) {
        const queryOptions = {
            where: { userId },
            order: { createdAt: "DESC" },
            take: limit,
            skip: (page - 1) * limit,
        };
        // Add version search (case-insensitive partial match)
        if (search) {
            queryOptions.where.version = (0, typeorm_1.ILike)(`%${search}%`);
        }
        const [jobs, total] = await this.repo.findAndCount(queryOptions);
        return {
            jobs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
}
exports.OtaService = OtaService;
//# sourceMappingURL=ota.service.js.map