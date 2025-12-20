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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDbTunnel = createDbTunnel;
exports.getLocalDbPort = getLocalDbPort;
exports.getLocalDbHost = getLocalDbHost;
// src/database/tunnel.ts
const tunnel_ssh_1 = require("tunnel-ssh"); // No need for full interface imports unless you want them
const fs = __importStar(require("fs"));
const env_1 = require("../config/env");
let tunnelServer = null;
let sshClient = null;
async function createDbTunnel() {
    if (!env_1.env.ssh.enabled) {
        console.log("SSH tunnel disabled – connecting directly to DB");
        return;
    }
    const privateKey = fs.readFileSync(env_1.env.ssh.keyPath);
    console.log(privateKey);
    const tunnelOptions = {
        autoClose: false, // Keep tunnel open even if no active connections (best for app servers)
        reconnectOnError: false, // Automatically reconnect if the tunnel connection is lost
    };
    const serverOptions = {
        port: env_1.env.ssh.localPort, // Local TCP server listens here
    };
    const forwardOptions = {
        srcAddr: "127.0.0.1", // Bind source only to localhost (security)
        // srcPort: DO NOT SET – let it use serverOptions.port automatically
        dstAddr: env_1.env.postgres.host, // RDS endpoint (as seen from bastion)
        dstPort: env_1.env.postgres.port, // Usually 5432
    };
    const sshOptions = {
        host: env_1.env.ssh.host,
        port: env_1.env.ssh.port,
        username: env_1.env.ssh.user,
        privateKey,
        keepaliveInterval: 30000, // Optional: prevents timeout
    };
    //   const forwardOptions = {
    //     srcAddr: "127.0.0.1",
    //     srcPort: env.ssh.localPort,
    //     dstAddr: env.postgres.host,
    //     dstPort: env.postgres.port,
    //   };
    console.log(`Creating SSH tunnel: local:${env_1.env.ssh.localPort} → ${env_1.env.postgres.host}:${env_1.env.postgres.port} via bastion`);
    try {
        [tunnelServer, sshClient] = await (0, tunnel_ssh_1.createTunnel)(tunnelOptions, serverOptions, sshOptions, forwardOptions);
        console.log(`SSH tunnel established on local port ${env_1.env.ssh.localPort}`);
        // Cleanup on process termination
        process.on("SIGINT", closeTunnel);
        process.on("SIGTERM", closeTunnel);
        process.on("exit", closeTunnel);
    }
    catch (error) {
        console.error("Failed to create SSH tunnel:", error.message);
        throw error;
    }
}
function closeTunnel() {
    if (tunnelServer) {
        console.log("Closing local tunnel server...");
        tunnelServer.close();
        tunnelServer = null;
    }
    if (sshClient) {
        console.log("Ending SSH connection...");
        sshClient.end();
        sshClient = null;
    }
}
function getLocalDbPort() {
    return env_1.env.ssh.enabled ? env_1.env.ssh.localPort : env_1.env.postgres.port;
}
function getLocalDbHost() {
    return "127.0.0.1";
}
//# sourceMappingURL=tunnel.js.map