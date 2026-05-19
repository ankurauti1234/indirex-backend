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
exports.LogoDailyViewershipCSV = void 0;
// src/database/entities/LogoDailyViewershipCSV.ts
const typeorm_1 = require("typeorm");
let LogoDailyViewershipCSV = class LogoDailyViewershipCSV {
};
exports.LogoDailyViewershipCSV = LogoDailyViewershipCSV;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LogoDailyViewershipCSV.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, unique: true }),
    __metadata("design:type", String)
], LogoDailyViewershipCSV.prototype, "date_label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], LogoDailyViewershipCSV.prototype, "s3_url", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], LogoDailyViewershipCSV.prototype, "createdAt", void 0);
exports.LogoDailyViewershipCSV = LogoDailyViewershipCSV = __decorate([
    (0, typeorm_1.Entity)({ name: "LogoDailyViewershipCSV" })
], LogoDailyViewershipCSV);
//# sourceMappingURL=LogoDailyViewershipCSV.js.map