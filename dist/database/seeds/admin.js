"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = void 0;
require("reflect-metadata");
const connection_1 = require("../connection");
const User_1 = require("../entities/User");
const encryption_1 = require("../../utils/encryption");
const seedAdmin = async () => {
    await connection_1.AppDataSource.initialize();
    const repo = connection_1.AppDataSource.getRepository(User_1.User);
    const admin = await repo.findOneBy({ email: "ravindra.gaikwad@inditronics.com" });
    if (admin) {
        console.log("Admin already exists – skipping seed");
        await connection_1.AppDataSource.destroy();
        return;
    }
    const hash = await (0, encryption_1.hashPassword)("Ravindra@123");
    await repo.insert({
        email: "ravindra.gaikwad@inditronics.com",
        password: hash,
        name: "Ravindra Gaikwad",
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
//# sourceMappingURL=admin.js.map