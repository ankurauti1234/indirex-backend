// src/api/remote-access/remote-access.service.ts
import { Client } from "ssh2";
import { readFileSync } from "fs";
import { join } from "path";
import { AppDataSource } from "../../database/connection";
import { RemoteAccessLog } from "../../database/entities/RemoteAccessLog";

const logRepo = AppDataSource.getRepository(RemoteAccessLog);
const EC2_KEY_PATH = join(process.cwd(), "keys", "apm-portkey-server.pem");
const EC2_HOST = "am.meter.prod.indirex.io";

export class RemoteAccessService {
  /**
   * List active meters from the jump host (EC2)
   * Uses improved logic to find latest port by highest PID
   */
  async listMeters(): Promise<Array<{ meterId: string; port: number; pid: number }>> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn
        .on("ready", () => {
          // Get list of ports associated with meter users (localhost only)
          const cmd = `sudo lsof -iTCP -sTCP:LISTEN -nP | grep "meter_" | grep "localhost\\|127.0.0.1\\|\\[::1\\]" | awk '{print $2, $3, $9}' | awk -F'[: ]' '{print $1, $2, $NF}'`;

          conn.exec(cmd, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            let output = "";
            stream
              .on("data", (d: Buffer) => (output += d.toString()))
              .on("close", () => {
                const meters: Array<{ meterId: string; port: number; pid: number }> = [];
                const lines = output.trim().split("\n");

                for (const line of lines) {
                  if (!line.trim()) continue;

                  const parts = line.trim().split(/\s+/);
                  if (parts.length < 3) continue;

                  const pid = parseInt(parts[0]);
                  const user = parts[1]; // e.g. meter_AM-10001
                  const port = parseInt(parts[2]);

                  const meterMatch = user.match(/^meter_(.*)$/);
                  const meterId = meterMatch ? meterMatch[1] : "";

                  if (meterId && port > 0 && !isNaN(pid)) {
                    meters.push({ meterId, port, pid });
                  }
                }

                // Keep only the latest PID (highest) per meter
                const latestMap: Record<string, { meterId: string; port: number; pid: number }> = {};
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
          host: EC2_HOST,
          port: 22,
          username: "ubuntu",
          privateKey: readFileSync(EC2_KEY_PATH, "utf8"),
        });
    });
  }

  /**
   * Get the latest port for a specific meter
   * Returns the port associated with the highest PID
   */
  async getLatestMeterPort(meterId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn
        .on("ready", () => {
          const meterUser = `meter_${meterId}`;
          // Get the list of ports associated with the meter user (localhost only)
          const cmd = `sudo lsof -iTCP -sTCP:LISTEN -nP | grep "${meterUser}" | grep "localhost\\|127.0.0.1\\|\\[::1\\]" | awk '{print $2, $9}' | awk -F'[: ]' '{print $1, $NF}' | sort -nr`;

          conn.exec(cmd, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            let output = "";
            stream
              .on("data", (d: Buffer) => (output += d.toString()))
              .on("close", () => {
                conn.end();

                const lines = output.trim().split("\n").filter(l => l.trim());
                
                if (lines.length === 0) {
                  return reject(new Error(`No active SSH port found for meter ${meterId}`));
                }

                // Extract the latest port (highest PID - first line after sort -nr)
                const parts = lines[0].trim().split(/\s+/);
                if (parts.length < 2) {
                  return reject(new Error(`Could not determine the latest port for meter ${meterId}`));
                }

                const latestPort = parseInt(parts[1]);
                
                if (isNaN(latestPort) || latestPort <= 0) {
                  return reject(new Error(`Invalid port found for meter ${meterId}`));
                }

                resolve(latestPort);
              });
          });
        })
        .on("error", (err) => reject(err))
        .connect({
          host: EC2_HOST,
          port: 22,
          username: "ubuntu",
          privateKey: readFileSync(EC2_KEY_PATH, "utf8"),
        });
    });
  }

  /**
   * Open SSH tunnel to meter via jump host
   * Automatically finds the latest port for the meter
   * Uses `indi@localhost` — NOT root
   */
  async startTunnel(
    meterId: string,
    userId: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<{ conn: Client; stream: any; logId: string; port: number }> {
    // 1. Get the latest port for this meter
    let port: number;
    try {
      port = await this.getLatestMeterPort(meterId);
    } catch (error) {
      throw new Error(`Failed to find active port for meter ${meterId}: ${error}`);
    }

    // 2. Log connection start
    const log = logRepo.create({
      userId,
      meterId,
      port,
      clientIp,
      userAgent,
    });
    await logRepo.save(log);

    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn
        .on("ready", () => {
          // Connect to meter using indi@localhost on the discovered port
          const cmd = `ssh -i /home/ubuntu/meter_auth_key -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null indi@localhost -p ${port}`;

          conn.shell((err, stream) => {
            if (err) {
              logRepo.update(log.id, { disconnectedAt: new Date() });
              return reject(err);
            }

            let ready = false;
            const onData = (data: Buffer) => {
              const out = data.toString();

              // Wait for any shell prompt: indi@ or $
              if (!ready && (out.includes("indi@") || out.includes("$") || out.includes("#"))) {
                ready = true;
                resolve({ conn, stream, logId: log.id, port });
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
          host: EC2_HOST,
          port: 22,
          username: "ubuntu",
          privateKey: readFileSync(EC2_KEY_PATH, "utf8"),
        });
    });
  }

  /**
   * Open SSH tunnel with explicit port (legacy method)
   * Uses `indi@localhost` — NOT root
   */
  async startTunnelWithPort(
    meterId: string,
    port: number,
    userId: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<{ conn: Client; stream: any; logId: string }> {
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
      const conn = new Client();

      conn
        .on("ready", () => {
          // Connect to meter using indi@localhost
          const cmd = `ssh -i /home/ubuntu/meter_auth_key -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null indi@localhost -p ${port}`;

          conn.shell((err, stream) => {
            if (err) {
              logRepo.update(log.id, { disconnectedAt: new Date() });
              return reject(err);
            }

            let ready = false;
            const onData = (data: Buffer) => {
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
          host: EC2_HOST,
          port: 22,
          username: "ubuntu",
          privateKey: readFileSync(EC2_KEY_PATH, "utf8"),
        });
    });
  }

  /**
   * Log disconnection
   */
  async endTunnel(logId: string): Promise<void> {
    await logRepo.update(logId, { disconnectedAt: new Date() });
  }
}