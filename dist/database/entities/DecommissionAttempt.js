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
exports.DecommissionAttempt = void 0;
const typeorm_1 = require("typeorm");
const Meter_1 = require("./Meter");
const Household_1 = require("./Household");
const User_1 = require("./User");
let DecommissionAttempt = class DecommissionAttempt {
};
exports.DecommissionAttempt = DecommissionAttempt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DecommissionAttempt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Meter_1.Meter, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "meter_id" }),
    __metadata("design:type", Meter_1.Meter)
], DecommissionAttempt.prototype, "meter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "household_id" }),
    __metadata("design:type", Household_1.Household)
], DecommissionAttempt.prototype, "household", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "attempted_by_user_id" }),
    __metadata("design:type", Object)
], DecommissionAttempt.prototype, "attemptedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20 }),
    __metadata("design:type", String)
], DecommissionAttempt.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], DecommissionAttempt.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], DecommissionAttempt.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: "attempted_at",
        type: "timestamptz",
    }),
    __metadata("design:type", Date)
], DecommissionAttempt.prototype, "attemptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "unassign_available_until",
        type: "timestamptz",
        nullable: true,
    }),
    __metadata("design:type", Object)
], DecommissionAttempt.prototype, "unassignAvailableUntil", void 0);
exports.DecommissionAttempt = DecommissionAttempt = __decorate([
    (0, typeorm_1.Entity)("decommission_attempts")
], DecommissionAttempt);
//# sourceMappingURL=DecommissionAttempt.js.map