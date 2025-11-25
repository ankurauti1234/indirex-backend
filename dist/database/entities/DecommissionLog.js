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
exports.DecommissionLog = void 0;
// src/database/entities/DecommissionLog.ts
const typeorm_1 = require("typeorm");
const Meter_1 = require("./Meter");
const Household_1 = require("./Household");
const User_1 = require("./User");
let DecommissionLog = class DecommissionLog {
    id;
    meter;
    household;
    decommissionedBy;
    decommissionedByUserId;
    reason;
    metadata;
    decommissionedAt;
};
exports.DecommissionLog = DecommissionLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DecommissionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Meter_1.Meter, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "meter_id" }),
    __metadata("design:type", Meter_1.Meter)
], DecommissionLog.prototype, "meter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "household_id" }),
    __metadata("design:type", Household_1.Household)
], DecommissionLog.prototype, "household", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "decommissioned_by_user_id" }),
    __metadata("design:type", Object)
], DecommissionLog.prototype, "decommissionedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "decommissioned_by_user_id", nullable: true }),
    __metadata("design:type", Object)
], DecommissionLog.prototype, "decommissionedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], DecommissionLog.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], DecommissionLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "decommissioned_at" }),
    __metadata("design:type", Date)
], DecommissionLog.prototype, "decommissionedAt", void 0);
exports.DecommissionLog = DecommissionLog = __decorate([
    (0, typeorm_1.Entity)({ name: "decommission_logs" }),
    (0, typeorm_1.Index)(["meter", "household"])
], DecommissionLog);
