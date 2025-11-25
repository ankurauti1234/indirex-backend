"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllSeeds = void 0;
require("reflect-metadata");
const connection_1 = require("../connection");
const admin_1 = require("./admin");
const events_1 = require("./events"); // Add this
const runAllSeeds = async () => {
    await connection_1.AppDataSource.initialize();
    console.log("Running all DB seeds…");
    await (0, admin_1.seedAdmin)();
    await (0, events_1.seedEvents)(); // Add this
    // await other seeds...
    console.log("All seeds completed");
    await connection_1.AppDataSource.destroy();
};
exports.runAllSeeds = runAllSeeds;
if (require.main === module) {
    (0, exports.runAllSeeds)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
