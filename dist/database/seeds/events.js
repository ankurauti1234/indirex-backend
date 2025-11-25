"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedEvents = void 0;
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection_1 = require("../connection");
const Event_1 = require("../entities/Event");
const seedEvents = async () => {
    await connection_1.AppDataSource.initialize();
    const repo = connection_1.AppDataSource.getRepository(Event_1.Event);
    // Check if already seeded
    const count = await repo.count();
    if (count > 0) {
        console.log("Events already seeded – skipping");
        await connection_1.AppDataSource.destroy();
        return;
    }
    // Event types map
    const eventTypes = {
        1: "temperature",
        2: "location",
        3: "system_alarm",
        4: "sim_alert",
        5: "sim_info",
        6: "image_capture",
        7: "audio_fingerprint",
        8: "power_on_off",
        9: "member_declarations",
        10: "misc",
    };
    const devices = ["AM-10001", "AM-10002", "AM-10003"];
    // Past 3 days from Nov 02, 2025 → Oct 30, 31, Nov 01
    const now = new Date("2025-11-02").getTime() / 1000; // Unix seconds
    const oneDay = 86400;
    const days = [now - 3 * oneDay, now - 2 * oneDay, now - 1 * oneDay];
    const events = [];
    for (const dayStart of days) {
        const dayEnd = dayStart + oneDay - 1; // End of day
        for (const device of devices) {
            const numEvents = Math.floor(Math.random() * 6) + 5; // 5-10
            for (let i = 0; i < numEvents; i++) {
                const type = Math.floor(Math.random() * 10) + 1; // 1-10
                const timestamp = Math.floor(Math.random() * (dayEnd - dayStart + 1)) + dayStart;
                let details = {};
                switch (type) {
                    case 1: // temperature
                        details = { temp: (Math.random() * 20 + 20).toFixed(2) }; // 20-40
                        break;
                    case 2: // location
                        details = {
                            lat: (Math.random() * 180 - 90).toFixed(6),
                            lon: (Math.random() * 360 - 180).toFixed(6),
                        };
                        break;
                    case 3: // system_alarm
                        details = { alarm_code: Math.floor(Math.random() * 900) + 100 }; // 100-999
                        break;
                    case 4: // sim_alert
                        details = { sim_status: Math.random() > 0.5 ? "active" : "inactive" };
                        break;
                    case 5: // sim_info
                        details = {
                            sim_id: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
                            carrier: ["Vodafone", "Airtel", "Jio"][Math.floor(Math.random() * 3)],
                        };
                        break;
                    case 6: // image_capture
                        details = { image_url: `http://example.com/img${Math.floor(Math.random() * 100) + 1}.jpg` };
                        break;
                    case 7: // audio_fingerprint
                        details = { fingerprint_id: Math.floor(Math.random() * 1000) + 1 };
                        break;
                    case 8: // power_on_off
                        details = { status: Math.random() > 0.5 ? "on" : "off" };
                        break;
                    case 9: // member_declarations
                        details = { members: Math.floor(Math.random() * 10) + 1 }; // 1-10
                        break;
                    case 10: // misc
                        details = { info: `misc data ${Math.floor(Math.random() * 100) + 1}` };
                        break;
                }
                events.push({
                    device_id: device,
                    timestamp,
                    type,
                    details,
                });
            }
        }
    }
    // Sort by timestamp for consistency
    events.sort((a, b) => a.timestamp - b.timestamp);
    await repo.insert(events);
    console.log(`Seeded ${events.length} dummy events`);
    await connection_1.AppDataSource.destroy();
};
exports.seedEvents = seedEvents;
// Run if direct
if (require.main === module) {
    (0, exports.seedEvents)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
