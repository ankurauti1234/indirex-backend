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
exports.HouseholdMeterHistory = void 0;
// src/database/entities/HouseholdMeterHistory.ts
const typeorm_1 = require("typeorm");
const Meter_1 = require("./Meter");
const Household_1 = require("./Household");
let HouseholdMeterHistory = class HouseholdMeterHistory {
};
exports.HouseholdMeterHistory = HouseholdMeterHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], HouseholdMeterHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Meter_1.Meter, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "meter_id" }),
    __metadata("design:type", Meter_1.Meter)
], HouseholdMeterHistory.prototype, "meter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "household_id" }),
    __metadata("design:type", Household_1.Household)
], HouseholdMeterHistory.prototype, "household", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], HouseholdMeterHistory.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "decommissioned_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], HouseholdMeterHistory.prototype, "decommissionedAt", void 0);
exports.HouseholdMeterHistory = HouseholdMeterHistory = __decorate([
    (0, typeorm_1.Entity)({ name: "household_meter_history" }),
    (0, typeorm_1.Index)(["meter"]),
    (0, typeorm_1.Index)(["household"])
], HouseholdMeterHistory);
//# sourceMappingURL=HouseholdMeterHistory.js.map