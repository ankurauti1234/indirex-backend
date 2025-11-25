"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteAccessService = void 0;
// src/api/remote-access/remote-access.service.ts
const ssh2_1 = require("ssh2");
const fs_1 = require("fs");
const path_1 = require("path");
const connection_1 = require("../../database/connection");
const RemoteAccessLog_1 = require("../../database/entities/RemoteAccessLog");
const logRepo = connection_1.AppDataSource.getRepository(RemoteAccessLog_1.RemoteAccessLog);
const EC2_KEY_PATH = (0, path_1.join)(process.cwd(), "keys", "apm-portkey-server.pem");
class RemoteAccessService {
    /**
     * List active meters from the jump host (EC2)
     */
    async listMeters() {
        return new Promise((resolve, reject) => {
            const conn = new ssh2_1.Client();
            conn
                .on("ready", () => {
                conn.exec('sudo lsof -i -n -P | grep LISTEN | grep sshd | grep "[::1]:"', (err, stream) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }
                    let output = "";
                    stream
                        .on("data", (d) => (output += d.toString()))
                        .on("close", () => {
                        const meters = [];
                        const lines = output.trim().split("\n");
                        for (const line of lines) {
                            if (!line.includes("meter_"))
                                continue;
                            const parts = line.trim().split(/\s+/);
                            if (parts.length < 9)
                                continue;
                            const pid = parseInt(parts[1]);
                            const user = parts[2]; // e.g. meter_AM-10001
                            const addr = parts[8]; // [::1]:40429
                            const portMatch = addr.match(/\[::1\]:(\d+)/);
                            if (!portMatch)
                                continue;
                            const port = parseInt(portMatch[1]);
                            const meterMatch = user.match(/^meter_(.*)$/);
                            const meterId = meterMatch ? meterMatch[1] : "";
                            if (meterId && port > 0 && !isNaN(pid)) {
                                meters.push({ meterId, port, pid });
                            }
                        }
                        // Keep only the latest PID per meter
                        const latestMap = {};
                        for (const m of meters) {
                            if (!latestMap[m.meterId] || m.pid > latestMap[m.meterId].pid) {
                                latestMap[m.meterId] = m;
                            }
                        }
                        conn.end();
                        resolve(Object.values(latestMap));
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
    /**
     * Open SSH tunnel to meter via jump host
     * Uses `indi@localhost` — NOT root
     */
    async startTunnel(meterId, port, userId, clientIp, userAgent) {
        // 1. Log connection start
        const log = logRepo.create({
            userId,
            meterId,
            port,
            clientIp,
            userAgent,
        });
        await logRepo.save(log);
        return new Promise((resolve, reject) => {
            const conn = new ssh2_1.Client();
            conn
                .on("ready", () => {
                // CORRECT: Use 'indi' user
                const cmd = `ssh -i /home/ubuntu/meter_auth_key -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null indi@localhost -p ${port}`;
                conn.shell((err, stream) => {
                    if (err) {
                        logRepo.update(log.id, { disconnectedAt: new Date() });
                        return reject(err);
                    }
                    let ready = false;
                    const onData = (data) => {
                        const out = data.toString();
                        // Wait for any shell prompt: indi@ or $
                        if (!ready && (out.includes("indi@") || out.includes("$") || out.includes("#"))) {
                            ready = true;
                            resolve({ conn, stream, logId: log.id });
                        }
                    };
                    stream.on("data", onData);
                    stream.write(cmd + "\n");
                });
            })
                .on("error", async (err) => {
                await logRepo.update(log.id, { disconnectedAt: new Date() });
                reject(err);
            })
                .connect({
                host: "13.235.91.236",
                port: 22,
                username: "ubuntu",
                privateKey: (0, fs_1.readFileSync)(EC2_KEY_PATH, "utf8"),
            });
        });
    }
    /**
     * Log disconnection
     */
    async endTunnel(logId) {
        await logRepo.update(logId, { disconnectedAt: new Date() });
    }
}
exports.RemoteAccessService = RemoteAccessService;
