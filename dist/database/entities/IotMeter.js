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
exports.IotMeter = exports.IotMeterStatus = void 0;
// src/database/entities/IotMeter.ts
const typeorm_1 = require("typeorm");
var IotMeterStatus;
(function (IotMeterStatus) {
    IotMeterStatus["REGISTERED"] = "registered";
    IotMeterStatus["UNREGISTERED"] = "unregistered";
})(IotMeterStatus || (exports.IotMeterStatus = IotMeterStatus = {}));
let IotMeter = class IotMeter {
    meterId;
    groupName;
    status;
    lastSeen;
    createdAt;
    updatedAt;
};
exports.IotMeter = IotMeter;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], IotMeter.prototype, "meterId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IotMeter.prototype, "groupName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: IotMeterStatus, default: IotMeterStatus.UNREGISTERED }),
    __metadata("design:type", String)
], IotMeter.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], IotMeter.prototype, "lastSeen", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IotMeter.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], IotMeter.prototype, "updatedAt", void 0);
exports.IotMeter = IotMeter = __decorate([
    (0, typeorm_1.Entity)({ name: "iot_meters" }),
    (0, typeorm_1.Index)(["groupName"]),
    (0, typeorm_1.Index)(["status"])
], IotMeter);
