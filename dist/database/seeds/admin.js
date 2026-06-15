"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminsBatch = void 0;
require("reflect-metadata");
const connection_1 = require("../connection");
const User_1 = require("../entities/User");
const encryption_1 = require("../../utils/encryption");
const EMAILS = [
    "mahesh.bhorade@inditronics.com",
    "manoj.patidar@inditronics.com",
    "abhishek.gawade@inditronics.com",
    "swapnil.gaikwad@inditronics.com",
    "nikhil.kshirsagar@inditronics.com",
    "aftab.momin@inditronics.com",
    "akkay.datt@inditronics.com",
    "vahan.nersesyan@inditronics.com",
    "pranav.dalve@inditronics.com"
];
const DEFAULT_PASSWORD = "Pass@123";
const toName = (email) => email
    .split("@")[0]
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const seedAdminsBatch = async () => {
    await connection_1.AppDataSource.initialize();
    const repo = connection_1.AppDataSource.getRepository(User_1.User);
    const hash = await (0, encryption_1.hashPassword)(DEFAULT_PASSWORD);
    for (const email of EMAILS) {
        const existing = await repo.findOneBy({ email });
        if (existing) {
            console.log(`Skipping ${email} – already exists`);
            continue;
        }
        await repo.insert({
            email,
            password: hash,
            name: toName(email),
            role: User_1.UserRole.ADMIN,
        });
        console.log(`Seeded admin: ${email}`);
    }
    await connection_1.AppDataSource.destroy();
};
exports.seedAdminsBatch = seedAdminsBatch;
// Allow direct execution: node dist/database/seeds/admins-batch.js
if (require.main === module) {
    (0, exports.seedAdminsBatch)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=admin.js.map