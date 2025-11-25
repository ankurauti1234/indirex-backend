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
exports.Meter = void 0;
// src/database/entities/Meter.ts
const typeorm_1 = require("typeorm");
const Household_1 = require("./Household");
const MeterOtp_1 = require("./MeterOtp");
const MeterAssignment_1 = require("./MeterAssignment");
let Meter = class Meter {
    id;
    meterId;
    meterType;
    assetSerialNumber;
    powerHATStatus;
    isAssigned;
    assignedHousehold;
    otps;
    assignments;
    createdAt;
    updatedAt;
    assignedHouseholdId;
};
exports.Meter = Meter;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Meter.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "meter_id", type: "varchar", length: 50, unique: true }),
    __metadata("design:type", String)
], Meter.prototype, "meterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "meter_type", type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Meter.prototype, "meterType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "asset_serial_number", type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Meter.prototype, "assetSerialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "power_hat_status", type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Meter.prototype, "powerHATStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_assigned", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Meter.prototype, "isAssigned", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, (household) => household.meters, {
        nullable: true,
        onDelete: "SET NULL",
    }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_household_id" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], Meter.prototype, "assignedHousehold", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MeterOtp_1.MeterOtp, (otp) => otp.meter),
    __metadata("design:type", Array)
], Meter.prototype, "otps", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MeterAssignment_1.MeterAssignment, (assignment) => assignment.meter),
    __metadata("design:type", Array)
], Meter.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Meter.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Meter.prototype, "updatedAt", void 0);
exports.Meter = Meter = __decorate([
    (0, typeorm_1.Entity)({ name: "meters" })
], Meter);
