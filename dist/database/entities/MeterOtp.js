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
exports.MeterOtp = void 0;
// src/database/entities/MeterOtp.ts
const typeorm_1 = require("typeorm");
const Meter_1 = require("./Meter");
let MeterOtp = class MeterOtp {
    id;
    meter;
    otpCode;
    expiresAt;
    consumed;
    createdAt;
};
exports.MeterOtp = MeterOtp;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MeterOtp.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Meter_1.Meter, (meter) => meter.otps, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "meter_id" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Meter_1.Meter)
], MeterOtp.prototype, "meter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "otp_code", type: "varchar", length: 10 }),
    __metadata("design:type", String)
], MeterOtp.prototype, "otpCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "expires_at", type: "timestamp" }),
    __metadata("design:type", Date)
], MeterOtp.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "consumed", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], MeterOtp.prototype, "consumed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], MeterOtp.prototype, "createdAt", void 0);
exports.MeterOtp = MeterOtp = __decorate([
    (0, typeorm_1.Entity)({ name: "meter_otps" })
], MeterOtp);
