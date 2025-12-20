"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishDecommissionWithAck = void 0;
// src/services/mqtt/mqtt.client.ts
const mqtt = __importStar(require("mqtt"));
const env_1 = require("../../config/env");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const delete_thing_1 = require("../../utils/delete-thing");
class MqttDecommissionClient {
    constructor() {
        this.client = null;
        this.connectPromise = null;
    }
    getCertPaths() {
        const keysDir = path_1.default.resolve(__dirname, "../../../keys");
        return {
            key: path_1.default.join(keysDir, "INDIREX-ADMIN.key"),
            cert: path_1.default.join(keysDir, "INDIREX-ADMIN.crt"),
            ca: path_1.default.join(keysDir, "AmazonRootCA1.pem"),
        };
    }
    ensureConnected() {
        if (this.client?.connected) {
            return Promise.resolve(this.client);
        }
        if (this.connectPromise)
            return this.connectPromise;
        const { key, cert, ca } = this.getCertPaths();
        console.log("Connecting to AWS IoT Core →", env_1.env.aws.iotEndpoint);
        console.log("Using cert:", cert);
        console.log("Using key:", key);
        this.connectPromise = new Promise((resolve, reject) => {
            const connectOpts = {
                clientId: `apm-decommission-server-${Date.now()}`,
                protocol: "mqtts",
                host: env_1.env.aws.iotEndpoint,
                port: 8883,
                key: fs_1.default.readFileSync(key),
                cert: fs_1.default.readFileSync(cert),
                ca: [fs_1.default.readFileSync(ca)],
                rejectUnauthorized: true,
                clean: true,
                reconnectPeriod: 5000,
                connectTimeout: 20000,
                keepalive: 60,
            };
            const client = mqtt.connect(`mqtts://${env_1.env.aws.iotEndpoint}`, connectOpts);
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
    async publishDecommissionWithAck(meterId, timeoutMs = 30000 // Keeping for backward compatibility but not used in new logic
    ) {
        const requestTopic = `apm/decommission/${meterId}`;
        const ackTopic = "apm/decommission";
        const maxAttempts = 3;
        const attemptTimeouts = [30000, 30000, 30000]; // 30s, 30s, 30s
        const basePayload = {
            decommissioning: true,
        };
        const client = await this.ensureConnected();
        // Subscribe once before all attempts
        await new Promise((resolve, reject) => {
            client.subscribe(ackTopic, { qos: 1 }, (err) => {
                if (err) {
                    reject(new Error("Failed to subscribe to ACK topic"));
                }
                else {
                    console.log(`Subscribed to ACK topic: ${ackTopic}`);
                    resolve();
                }
            });
        });
        // Try each attempt sequentially
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const attemptTimeout = attemptTimeouts[attempt - 1];
            console.log(`Decommission attempt ${attempt}/${maxAttempts} for ${meterId} (timeout: ${attemptTimeout}ms)`);
            try {
                // Send command and wait for ACK with specific timeout
                await this.sendCommandAndWaitForAck(client, requestTopic, ackTopic, meterId, basePayload, attempt, attemptTimeout);
                // SUCCESS - ACK received, cleanup and delete AWS resources
                console.log(`✓ DECOMMISSION SUCCESS on attempt ${attempt} for ${meterId}`);
                client.unsubscribe(ackTopic, () => { });
                // Delete Thing and certificates from AWS IoT
                (0, delete_thing_1.deleteThingAndCerts)(meterId)
                    .then(() => console.log(`AWS IoT Thing deleted: ${meterId}`))
                    .catch((err) => console.error(`ERROR deleting AWS IoT thing ${meterId}:`, err));
                return; // Success - exit function
            }
            catch (error) {
                console.warn(`✗ Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
                // If this was the last attempt, throw the error
                if (attempt === maxAttempts) {
                    client.unsubscribe(ackTopic, () => { });
                    throw new Error(`Decommission failed after ${maxAttempts} attempts. Last error: ${error.message}`);
                }
                // Otherwise, continue to next attempt (no delay needed, it's built into the timeout)
            }
        }
    }
    /**
     * Helper: Sends one command and waits for ACK with timeout
     */
    sendCommandAndWaitForAck(client, requestTopic, ackTopic, meterId, basePayload, attempt, timeoutMs) {
        return new Promise((resolve, reject) => {
            let settled = false;
            let timeoutHandle;
            const cleanup = () => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeoutHandle);
                client.removeListener("message", onMessage);
            };
            // Set timeout for this specific attempt
            timeoutHandle = setTimeout(() => {
                cleanup();
                reject(new Error(`No ACK received within ${timeoutMs}ms for attempt ${attempt}`));
            }, timeoutMs);
            // Listen for ACK
            const onMessage = (topic, message) => {
                if (topic !== ackTopic || settled)
                    return;
                let payload;
                try {
                    payload = JSON.parse(message.toString());
                }
                catch (e) {
                    console.error("Invalid JSON in decommission ACK:", message.toString());
                    return;
                }
                // Check if this ACK is for our meter
                if (payload.meter_id !== meterId)
                    return;
                if (payload.is_decommissioning_success === true) {
                    cleanup();
                    console.log(`✓ ACK received from ${meterId} on attempt ${attempt}`);
                    resolve();
                }
                else {
                    cleanup();
                    reject(new Error(`Device reported decommissioning failed (attempt ${attempt})`));
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
                    reject(new Error(`Publish failed (attempt ${attempt}) to ${meterId}: ${err.message}`));
                }
                else {
                    console.log(`→ Decommission command sent (attempt ${attempt}) to ${meterId}`);
                }
            });
        });
    }
}
// Singleton instance
const mqttClient = new MqttDecommissionClient();
// Export function used by service
const publishDecommissionWithAck = (meterId, timeoutMs) => mqttClient.publishDecommissionWithAck(meterId, timeoutMs);
exports.publishDecommissionWithAck = publishDecommissionWithAck;
//# sourceMappingURL=mqtt.client.js.map