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
exports.MeterAssignment = void 0;
// src/database/entities/MeterAssignment.ts
const typeorm_1 = require("typeorm");
const Meter_1 = require("./Meter");
const Household_1 = require("./Household");
let MeterAssignment = class MeterAssignment {
};
exports.MeterAssignment = MeterAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MeterAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Meter_1.Meter, (meter) => meter.assignments, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "meter_id" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Meter_1.Meter)
], MeterAssignment.prototype, "meter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, (household) => household.assignments, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "household_id" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Household_1.Household)
], MeterAssignment.prototype, "household", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_by", type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", String)
], MeterAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "assigned_at" }),
    __metadata("design:type", Date)
], MeterAssignment.prototype, "assignedAt", void 0);
exports.MeterAssignment = MeterAssignment = __decorate([
    (0, typeorm_1.Entity)({ name: "meter_assignments" }),
    (0, typeorm_1.Unique)(["meter", "household"])
], MeterAssignment);
//# sourceMappingURL=MeterAssignment.js.map