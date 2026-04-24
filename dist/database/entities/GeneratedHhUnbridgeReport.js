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
exports.GeneratedHHUnbridgeReport = void 0;
// src/database/entities/GeneratedHHUnbridgeReport.ts
const typeorm_1 = require("typeorm");
let GeneratedHHUnbridgeReport = class GeneratedHHUnbridgeReport {
};
exports.GeneratedHHUnbridgeReport = GeneratedHHUnbridgeReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GeneratedHHUnbridgeReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], GeneratedHHUnbridgeReport.prototype, "generation_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], GeneratedHHUnbridgeReport.prototype, "report_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], GeneratedHHUnbridgeReport.prototype, "report_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], GeneratedHHUnbridgeReport.prototype, "session_count", void 0);
exports.GeneratedHHUnbridgeReport = GeneratedHHUnbridgeReport = __decorate([
    (0, typeorm_1.Entity)({ name: "generated_hh_unbridge_report" }),
    (0, typeorm_1.Index)("idx_report_date", ["report_date"])
], GeneratedHHUnbridgeReport);
//# sourceMappingURL=GeneratedHhUnbridgeReport.js.map