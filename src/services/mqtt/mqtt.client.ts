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

    console.log("Connecting to AWS IoT Core →", env.aws.awsIotEndpoint);
    console.log("Using cert:", cert);
    console.log("Using key:", key);

    this.connectPromise = new Promise((resolve, reject) => {
      const connectOpts = {
        clientId: "apm-decommission-server",
        protocol: "mqtts",
        port: 8883,
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert),
        ca: fs.readFileSync(ca),
        rejectUnauthorized: true,
        clean: true,
        reconnectPeriod: 5000,
        keepalive: 60,
        secureProtocol: "TLSv1_2_method", // Critical for ap-south-1
      } as mqtt.IClientOptions;

      const client = mqtt.connect(`mqtts://${env.aws.awsIotEndpoint}`, connectOpts);

      const timeout = setTimeout(() => reject(new Error("MQTT connection timeout")), 20000);

      client.once("connect", () => {
        clearTimeout(timeout);
        console.log("MQTT CONNECTED AND STABLE - READY TO PUBLISH");
        this.client = client;
        this.connectPromise = null;
        resolve(client);
      });

      client.once("error", (err) => {
        clearTimeout(timeout);
        console.error("MQTT CONNECT FAILED:", err.message);
        this.connectPromise = null;
        reject(err);
      });

      client.on("close", () => {
        console.warn("MQTT connection closed");
        this.client = null;
      });

      client.on("offline", () => console.warn("MQTT client offline"));
    });

    return this.connectPromise;
  }

  /**
   * Publish decommission command TWICE with 1-second gap
   * (Many meters need duplicate messages to trigger reliably)
   */
  async publishDecommission(meterId: string): Promise<void> {
    const topic = `apm/decommission/${meterId}`;
    const payload = JSON.stringify({
      decommissioning: true,
      // timestamp: new Date().toISOString(),
      // source: "apm-backend",
      // attempt: null as number | null,
    });

    const client = await this.ensureConnected();

    const publishOnce = (attempt: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const msg = payload.replace('"attempt":null', `"attempt":${attempt}`);
        client.publish(topic, msg, { qos: 1 }, (err) => {
          if (err) {
            console.error(`PUBLISH FAILED (attempt ${attempt}) → ${topic}`, err);
            reject(err);
          } else {
            console.log(`DECOMMISSION COMMAND SENT (attempt ${attempt}) → ${topic}`);
            resolve();
          }
        });
      });
    };

    try {
      // First publish
      await publishOnce(1);

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second publish
      await publishOnce(2);

      console.log(`DECOMMISSION COMMAND SUCCESSFULLY SENT TWICE → ${meterId}`);
    } catch (err) {
      console.error("One or both publish attempts failed for", meterId);
      throw err; // Let caller know
    }
  }
}

// Singleton
const mqttClient = new MqttDecommissionClient();
export const publishDecommission = (meterId: string): Promise<void> =>
  mqttClient.publishDecommission(meterId);