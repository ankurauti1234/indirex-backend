// src/services/mqtt/mqtt.client.ts
import * as mqtt from "mqtt";
import { env } from "../../config/env";
import fs from "fs";
import path from "path";
import { deleteThingAndCerts } from "../../utils/delete-thing";

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

      const client = mqtt.connect(
        `mqtts://${env.aws.iotEndpoint}`,
        connectOpts
      );

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
   * Sends decommission command with retry logic:
   * - Attempt 1: Wait 10s for ACK
   * - Attempt 2: Wait 5s for ACK  
   * - Attempt 3: Wait 5s for ACK
   * Total max time: 10 + 5 + 5 = 20 seconds
   */
  async publishDecommissionWithAck(
    meterId: string,
    timeoutMs = 30000 // Keeping for backward compatibility but not used in new logic
  ): Promise<void> {
    const requestTopic = `apm/decommission/${meterId}`;
    const ackTopic = "apm/decommission";
    const maxAttempts = 3;
    const attemptTimeouts = [30000, 30000, 30000]; // 30s, 30s, 30s

    const basePayload = {
      decommissioning: true,
    };

    const client = await this.ensureConnected();

    // Subscribe once before all attempts
    await new Promise<void>((resolve, reject) => {
      client.subscribe(ackTopic, { qos: 1 }, (err) => {
        if (err) {
          reject(new Error("Failed to subscribe to ACK topic"));
        } else {
          console.log(`Subscribed to ACK topic: ${ackTopic}`);
          resolve();
        }
      });
    });

    // Try each attempt sequentially
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptTimeout = attemptTimeouts[attempt - 1];
      
      console.log(
        `Decommission attempt ${attempt}/${maxAttempts} for ${meterId} (timeout: ${attemptTimeout}ms)`
      );

      try {
        // Send command and wait for ACK with specific timeout
        await this.sendCommandAndWaitForAck(
          client,
          requestTopic,
          ackTopic,
          meterId,
          basePayload,
          attempt,
          attemptTimeout
        );

        // SUCCESS - ACK received, cleanup and delete AWS resources
        console.log(`✓ DECOMMISSION SUCCESS on attempt ${attempt} for ${meterId}`);
        
        client.unsubscribe(ackTopic, () => {});
        
        // Delete Thing and certificates from AWS IoT
        deleteThingAndCerts(meterId)
          .then(() => console.log(`AWS IoT Thing deleted: ${meterId}`))
          .catch((err) =>
            console.error(`ERROR deleting AWS IoT thing ${meterId}:`, err)
          );

        return; // Success - exit function
        
      } catch (error: any) {
        console.warn(
          `✗ Attempt ${attempt}/${maxAttempts} failed: ${error.message}`
        );
        
        // If this was the last attempt, throw the error
        if (attempt === maxAttempts) {
          client.unsubscribe(ackTopic, () => {});
          throw new Error(
            `Decommission failed after ${maxAttempts} attempts. Last error: ${error.message}`
          );
        }
        
        // Otherwise, continue to next attempt (no delay needed, it's built into the timeout)
      }
    }
  }

  /**
   * Helper: Sends one command and waits for ACK with timeout
   */
  private sendCommandAndWaitForAck(
    client: mqtt.MqttClient,
    requestTopic: string,
    ackTopic: string,
    meterId: string,
    basePayload: any,
    attempt: number,
    timeoutMs: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutHandle: NodeJS.Timeout;

      const cleanup = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutHandle);
        client.removeListener("message", onMessage);
      };

      // Set timeout for this specific attempt
      timeoutHandle = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `No ACK received within ${timeoutMs}ms for attempt ${attempt}`
          )
        );
      }, timeoutMs);

      // Listen for ACK
      const onMessage = (topic: string, message: Buffer) => {
        if (topic !== ackTopic || settled) return;

        let payload;
        try {
          payload = JSON.parse(message.toString());
        } catch (e) {
          console.error(
            "Invalid JSON in decommission ACK:",
            message.toString()
          );
          return;
        }

        // Check if this ACK is for our meter
        if (payload.meter_id !== meterId) return;

        if (payload.is_decommissioning_success === true) {
          cleanup();
          console.log(
            `✓ ACK received from ${meterId} on attempt ${attempt}`
          );
          resolve();
        } else {
          cleanup();
          reject(
            new Error(
              `Device reported decommissioning failed (attempt ${attempt})`
            )
          );
        }
      };

      client.on("message", onMessage);

      // Publish the command
      const payload = JSON.stringify({
        ...basePayload,
        attempt,
        timestamp: new Date().toISOString(),
      });

      client.publish(requestTopic, payload, { qos: 1 }, (err) => {
        if (err) {
          cleanup();
          reject(
            new Error(
              `Publish failed (attempt ${attempt}) to ${meterId}: ${err.message}`
            )
          );
        } else {
          console.log(
            `→ Decommission command sent (attempt ${attempt}) to ${meterId}`
          );
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