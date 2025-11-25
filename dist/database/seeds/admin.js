"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = void 0;
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection_1 = require("../connection");
const User_1 = require("../entities/User");
const encryption_1 = require("../../utils/encryption");
const seedAdmin = async () => {
    await connection_1.AppDataSource.initialize();
    const repo = connection_1.AppDataSource.getRepository(User_1.User);
    const admin = await repo.findOneBy({ email: "admin@example.com" });
    if (admin) {
        console.log("Admin already exists – skipping seed");
        await connection_1.AppDataSource.destroy();
        return;
    }
    const hash = await (0, encryption_1.hashPassword)("Admin123!");
    await repo.insert({
        email: "admin@inditronics.com",
        password: hash,
        name: "Indirex Admin",
        role: User_1.UserRole.ADMIN
    });
    console.log("Admin seeded");
    await connection_1.AppDataSource.destroy();
};
exports.seedAdmin = seedAdmin;
// Allow direct execution: node dist/database/seeds/admin.js
if (require.main === module) {
    (0, exports.seedAdmin)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
