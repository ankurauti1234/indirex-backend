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
exports.PreregisteredContact = void 0;
// src/database/entities/PreregisteredContact.ts
const typeorm_1 = require("typeorm");
const Household_1 = require("./Household");
let PreregisteredContact = class PreregisteredContact {
};
exports.PreregisteredContact = PreregisteredContact;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PreregisteredContact.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Household_1.Household, (household) => household.contacts, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "household_id" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Household_1.Household)
], PreregisteredContact.prototype, "household", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "contact_email", type: "varchar", length: 255 }),
    __metadata("design:type", String)
], PreregisteredContact.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_active", type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], PreregisteredContact.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], PreregisteredContact.prototype, "createdAt", void 0);
exports.PreregisteredContact = PreregisteredContact = __decorate([
    (0, typeorm_1.Entity)({ name: "preregistered_contacts" })
], PreregisteredContact);
//# sourceMappingURL=PreregisteredContact.js.map