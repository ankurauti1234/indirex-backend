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
exports.UnassignLog = void 0;
const typeorm_1 = require("typeorm");
const Meter_1 = require("./Meter");
const Household_1 = require("./Household");
const User_1 = require("./User");
let UnassignLog = class UnassignLog {
};
exports.UnassignLog = UnassignLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UnassignLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Meter_1.Meter, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "meter_id" }),
    __metadata("design:type", Meter_1.Meter)
], UnassignLog.prototype, "meter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "household_id" }),
    __metadata("design:type", Household_1.Household)
], UnassignLog.prototype, "household", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "unassigned_by_user_id" }),
    __metadata("design:type", Object)
], UnassignLog.prototype, "unassignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "unassigned_by_user_id", nullable: true }),
    __metadata("design:type", Object)
], UnassignLog.prototype, "unassignedByUserId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "unassigned_at" }),
    __metadata("design:type", Date)
], UnassignLog.prototype, "unassignedAt", void 0);
exports.UnassignLog = UnassignLog = __decorate([
    (0, typeorm_1.Entity)({ name: "unassign_logs" }),
    (0, typeorm_1.Index)(["meter", "household"])
], UnassignLog);
//# sourceMappingURL=UnassignLog.js.map