"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtaJob = exports.OtaJobStatus = void 0;
// src/database/entities/OtaJob.ts
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var OtaJobStatus;
(function (OtaJobStatus) {
    OtaJobStatus["PENDING"] = "pending";
    OtaJobStatus["IN_PROGRESS"] = "in_progress";
    OtaJobStatus["SUCCEEDED"] = "succeeded";
    OtaJobStatus["FAILED"] = "failed";
    OtaJobStatus["CANCELED"] = "canceled";
})(OtaJobStatus || (exports.OtaJobStatus = OtaJobStatus = {}));
let OtaJob = class OtaJob {
};
exports.OtaJob = OtaJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], OtaJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "s3KeyUpdate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "s3UrlUpdate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "s3KeyJobDoc", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "s3UrlJobDoc", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "downloadPath", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { array: true }) // <-- PostgreSQL TEXT[]
    ,
    __metadata("design:type", Array)
], OtaJob.prototype, "targets", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OtaJob.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OtaJob.prototype, "jobArn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: OtaJobStatus, default: OtaJobStatus.PENDING }),
    __metadata("design:type", String)
], OtaJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], OtaJob.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    __metadata("design:type", User_1.User)
], OtaJob.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], OtaJob.prototype, "createdAt", void 0);
exports.OtaJob = OtaJob = __decorate([
    (0, typeorm_1.Entity)({ name: "ota_jobs" })
], OtaJob);
//# sourceMappingURL=OtaJob.js.map