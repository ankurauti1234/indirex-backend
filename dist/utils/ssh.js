"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveMeters = getActiveMeters;
// src/utils/ssh-utils.ts
const ssh2_1 = require("ssh2");
const fs_1 = require("fs");
const path_1 = require("path");
// RESOLVE FROM PROJECT ROOT → ./keys/apm-portkey-server.pem
const EC2_KEY_PATH = (0, path_1.join)(process.cwd(), "keys", "apm-portkey-server.pem");
async function getActiveMeters() {
    return new Promise((resolve, reject) => {
        const conn = new ssh2_1.Client();
        conn
            .on("ready", () => {
            conn.exec('sudo lsof -i -n -P | grep LISTEN | grep sshd | grep "[::1]:"', (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                let out = "";
                stream
                    .on("data", (d) => (out += d.toString()))
                    .on("close", () => {
                    const lines = out.trim().split("\n");
                    const meters = [];
                    for (const line of lines) {
                        if (!line.includes("meter_"))
                            continue;
                        const parts = line.trim().split(/\s+/);
                        if (parts.length < 9)
                            continue;
                        const pid = parseInt(parts[1]);
                        const user = parts[2];
                        const addr = parts[8]; // [::1]:36447
                        const portMatch = addr.match(/\[::1\]:(\d+)/);
                        if (!portMatch)
                            continue;
                        const port = parseInt(portMatch[1]);
                        const meterMatch = user.match(/meter_(.*)/);
                        const meterId = meterMatch ? meterMatch[1] : "";
                        if (meterId && port > 0 && !isNaN(pid)) {
                            meters.push({ meterId, port, pid });
                        }
                    }
                    // Keep only latest PID per meter
                    const groups = {};
                    for (const m of meters) {
                        if (!groups[m.meterId] || m.pid > groups[m.meterId].pid) {
                            groups[m.meterId] = m;
                        }
                    }
                    conn.end();
                    resolve(Object.values(groups));
                });
            });
        })
            .on("error", (err) => reject(err))
            .connect({
            host: "13.235.91.236",
            port: 22,
            username: "ubuntu",
            privateKey: (0, fs_1.readFileSync)(EC2_KEY_PATH, "utf8"),
        });
    });
}
//# sourceMappingURL=ssh.js.map