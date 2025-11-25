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
exports.EventMapping = void 0;
// src/database/entities/EventMapping.ts
const typeorm_1 = require("typeorm");
let EventMapping = class EventMapping {
    id;
    type; // Event type (e.g., 14, 15)
    name; // Human-readable name
    description;
    is_alert; // Critical: marks if it's an alert
    severity;
    enabled;
};
exports.EventMapping = EventMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EventMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], EventMapping.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventMapping.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EventMapping.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EventMapping.prototype, "is_alert", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "default" }),
    __metadata("design:type", String)
], EventMapping.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], EventMapping.prototype, "enabled", void 0);
exports.EventMapping = EventMapping = __decorate([
    (0, typeorm_1.Entity)({ name: "event_mapping" }),
    (0, typeorm_1.Unique)(["type"]) // One mapping per type
], EventMapping);
