// src/services/mqtt/mqtt.client.ts
import * as mqtt from "mqtt";
import { env } from "../../config/env";
import fs from "fs";
import path from "path";

class MqttDecommissionClient {
  private client: mqtt.MqttClient | null = null;
  private connectPromise: Promise<mqtt.MqttClient> | null = null;

  private getCertPaths() {
    const keysDir = path.resolve(__dirname, "../../../keys");
    return {
      key: path.join(keysDir, "INDIREX-ADMIN.key"),
      cert: path.join(keysDir, "INDIREX-ADMIN.crt"),
      ca: path.join(keysDir, "AmazonRootCA1.pem"),
    };
  }

  private ensureConnected(): Promise<mqtt.MqttClient> {
    if (this.client?.connected) {
      return Promise.resolve(this.client);
    }

    if (this.connectPromise) return this.connectPromise;

    const { key, cert, ca } = this.getCertPaths();

    console.log("Connecting to AWS IoT Core →", env.aws.iotEndpoint);
    console.log("Using cert:", cert);
    console.log("Using key:", key);

    this.connectPromise = new Promise((resolve, reject) => {
      const connectOpts: mqtt.IClientOptions = {
        clientId: `apm-decommission-server-${Date.now()}`,
        protocol: "mqtts",
        host: env.aws.iotEndpoint,
        port: 8883,
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert),
        ca: [fs.readFileSync(ca)],
        rejectUnauthorized: true,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 20000,
        keepalive: 60,
      };

      const client = mqtt.connect(`mqtts://${env.aws.iotEndpoint}`, connectOpts);

      const timeout = setTimeout(() => {
        reject(new Error("MQTT connection timeout after 20s"));
      }, 20000);

      client.once("connect", () => {
        clearTimeout(timeout);
        console.log("MQTT CONNECTED - Ready to publish decommission commands");
        this.client = client;
        this.connectPromise = null;
        resolve(client);
      });

      client.once("error", (err) => {
        clearTimeout(timeout);
        console.error("MQTT connection error:", err.message);
        this.connectPromise = null;
        reject(err);
      });

      client.on("close", () => {
        console.warn("MQTT connection closed");
        this.client = null;
      });

      client.on("offline", () => console.warn("MQTT client went offline"));
    });

    return this.connectPromise;
  }

  /**
   * Sends decommission command + waits for device ACK on apm/decommission
   */
  async publishDecommissionWithAck(
    meterId: string,
    timeoutMs = 30000
  ): Promise<void> {
    const requestTopic = `apm/decommission/${meterId}`;
    const ackTopic = "apm/decommission";

    const basePayload = {
      decommissioning: true,
    };

    const client = await this.ensureConnected();

    return new Promise((resolve, reject) => {
      let settled = false;
      let ackReceived = false;

      const cleanup = () => {
        if (settled) return;
        settled = true;
        client.removeAllListeners("message");
        client.unsubscribe(ackTopic, () => {});
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`No decommission ACK received from meter within ${timeoutMs / 1000}s`));
      }, timeoutMs);

      // Listen for ACK
      const onMessage = (topic: string, message: Buffer) => {
        if (topic !== ackTopic) return;

        let payload;
        try {
          payload = JSON.parse(message.toString());
        } catch (e) {
          console.error("Invalid JSON in decommission ACK:", message.toString());
          return; // Ignore malformed messages
        }

        // Now safely access payload
        if (payload.meter_id !== meterId) return;

        if (payload.is_decommissioning_success === true) {
          clearTimeout(timeout);
          cleanup();
          console.log(`DECOMMISSION SUCCESS ACK from ${meterId}`);
          resolve();
        } else {
          clearTimeout(timeout);
          cleanup();
          reject(new Error("Device reported decommissioning failed"));
        }
      };

      client.subscribe(ackTopic, { qos: 1 }, (err) => {
        if (err) {
          clearTimeout(timeout);
          cleanup();
          return reject(new Error("Failed to subscribe to ACK topic"));
        }
        console.log(`Subscribed to ACK topic: ${ackTopic}`);
      });

      client.on("message", onMessage);

      // Publish command twice with 1s delay
      const publishAttempt = (attempt: number) => {
        return new Promise<void>((res, rej) => {
          const payload = JSON.stringify({
            ...basePayload,
            attempt,
          });

          client.publish(requestTopic, payload, { qos: 1 }, (err) => {
            if (err) {
              console.error(`Publish failed (attempt ${attempt}) to ${meterId}:`, err.message);
              rej(err);
            } else {
              console.log(`Decommission command sent (attempt ${attempt}) → ${meterId}`);
              res();
            }
          });
        });
      };

      // Send first, wait 1s, send second
      publishAttempt(1)
        .then(() => new Promise(r => setTimeout(r, 1000)))
        .then(() => publishAttempt(2))
        .catch((err) => {
          if (!settled) {
            clearTimeout(timeout);
            cleanup();
            reject(new Error(`Failed to send decommission command: ${err.message}`));
          }
        });
    });
  }
}

// Singleton instance
const mqttClient = new MqttDecommissionClient();

// Export function used by service
export const publishDecommissionWithAck = (
  meterId: string,
  timeoutMs?: number
): Promise<void> => mqttClient.publishDecommissionWithAck(meterId, timeoutMs);