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
exports.publishDecommission = void 0;
// src/services/mqtt/mqtt.client.ts
const mqtt = __importStar(require("mqtt"));
const env_1 = require("../../config/env");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MqttDecommissionClient {
    client = null;
    connectPromise = null;
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
                clientId: "apm-decommission-server",
                protocol: "mqtts",
                port: 8883,
                key: fs_1.default.readFileSync(key),
                cert: fs_1.default.readFileSync(cert),
                ca: fs_1.default.readFileSync(ca),
                rejectUnauthorized: true,
                clean: true,
                reconnectPeriod: 5000,
                keepalive: 60,
                secureProtocol: "TLSv1_2_method", // Critical for ap-south-1
            };
            const client = mqtt.connect(`mqtts://${env_1.env.aws.iotEndpoint}`, connectOpts);
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
    async publishDecommission(meterId) {
        const topic = `apm/decommission/${meterId}`;
        const payload = JSON.stringify({
            decommissioning: true,
            // timestamp: new Date().toISOString(),
            // source: "apm-backend",
            // attempt: null as number | null,
        });
        const client = await this.ensureConnected();
        const publishOnce = (attempt) => {
            return new Promise((resolve, reject) => {
                const msg = payload.replace('"attempt":null', `"attempt":${attempt}`);
                client.publish(topic, msg, { qos: 1 }, (err) => {
                    if (err) {
                        console.error(`PUBLISH FAILED (attempt ${attempt}) → ${topic}`, err);
                        reject(err);
                    }
                    else {
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
        }
        catch (err) {
            console.error("One or both publish attempts failed for", meterId);
            throw err; // Let caller know
        }
    }
}
// Singleton
const mqttClient = new MqttDecommissionClient();
const publishDecommission = (meterId) => mqttClient.publishDecommission(meterId);
exports.publishDecommission = publishDecommission;
