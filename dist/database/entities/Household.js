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
exports.Household = void 0;
// src/database/entities/Household.ts
const typeorm_1 = require("typeorm");
const Member_1 = require("./Member");
const Meter_1 = require("./Meter");
const PreregisteredContact_1 = require("./PreregisteredContact");
const MeterAssignment_1 = require("./MeterAssignment");
let Household = class Household {
    id;
    hhid;
    createdAt;
    // Relations
    members;
    meters;
    assignments;
    contacts;
};
exports.Household = Household;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Household.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, unique: true }),
    __metadata("design:type", String)
], Household.prototype, "hhid", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Household.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Member_1.Member, (member) => member.household),
    __metadata("design:type", Array)
], Household.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Meter_1.Meter, (meter) => meter.assignedHousehold),
    __metadata("design:type", Array)
], Household.prototype, "meters", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MeterAssignment_1.MeterAssignment, (assignment) => assignment.household),
    __metadata("design:type", Array)
], Household.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PreregisteredContact_1.PreregisteredContact, (contact) => contact.household),
    __metadata("design:type", Array)
], Household.prototype, "contacts", void 0);
exports.Household = Household = __decorate([
    (0, typeorm_1.Entity)({ name: "households" })
], Household);
