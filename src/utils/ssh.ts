// src/utils/ssh-utils.ts
import { Client } from "ssh2";
import { readFileSync } from "fs";
import { join } from "path";

// RESOLVE FROM PROJECT ROOT → ./keys/apm-portkey-server.pem
const EC2_KEY_PATH = join(process.cwd(), "keys", "apm-portkey-server.pem");

export interface ActiveMeter {
  meterId: string;
  port: number;
  pid: number;
}

export async function getActiveMeters(): Promise<ActiveMeter[]> {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.exec(
          'sudo lsof -i -n -P | grep LISTEN | grep sshd | grep "[::1]:"',
          (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            let out = "";
            stream
              .on("data", (d: Buffer) => (out += d.toString()))
              .on("close", () => {
                const lines = out.trim().split("\n");
                const meters: ActiveMeter[] = [];

                for (const line of lines) {
                  if (!line.includes("meter_")) continue;

                  const parts = line.trim().split(/\s+/);
                  if (parts.length < 9) continue;

                  const pid = parseInt(parts[1]);
                  const user = parts[2];
                  const addr = parts[8]; // [::1]:36447

                  const portMatch = addr.match(/\[::1\]:(\d+)/);
                  if (!portMatch) continue;

                  const port = parseInt(portMatch[1]);
                  const meterMatch = user.match(/meter_(.*)/);
                  const meterId = meterMatch ? meterMatch[1] : "";

                  if (meterId && port > 0 && !isNaN(pid)) {
                    meters.push({ meterId, port, pid });
                  }
                }

                // Keep only latest PID per meter
                const groups: Record<string, ActiveMeter> = {};
                for (const m of meters) {
                  if (!groups[m.meterId] || m.pid > groups[m.meterId].pid) {
                    groups[m.meterId] = m;
                  }
                }

                conn.end();
                resolve(Object.values(groups));
              });
          }
        );
      })
      .on("error", (err) => reject(err))
      .connect({
        host: "13.235.91.236",
        port: 22,
        username: "ubuntu",
        privateKey: readFileSync(EC2_KEY_PATH, "utf8"),
      });
  });
}