// src/database/tunnel.ts
import { createTunnel } from "tunnel-ssh"; // No need for full interface imports unless you want them
import * as fs from "fs";
import { env } from "../config/env";

let tunnelServer: any = null;
let sshClient: any = null;

export async function createDbTunnel(): Promise<void> {
  if (!env.ssh.enabled) {
    console.log("SSH tunnel disabled – connecting directly to DB");
    return;
  }

  const privateKey = fs.readFileSync(env.ssh.keyPath);
  console.log(privateKey)

  const tunnelOptions = {
    autoClose: false, // Keep tunnel open even if no active connections (best for app servers)
    reconnectOnError: true, // Automatically reconnect if the tunnel connection is lost
  };

const serverOptions = {
  port: env.ssh.localPort,  // Local TCP server listens here
};

const forwardOptions = {
  srcAddr: "127.0.0.1",      // Bind source only to localhost (security)
  srcPort: env.ssh.localPort,
  dstAddr: env.postgres.host,  // RDS endpoint (as seen from bastion)
  dstPort: env.postgres.port,  // Usually 5432
};

  const sshOptions = {
    host: env.ssh.host,
    port: env.ssh.port,
    username: env.ssh.user,
    privateKey,
    keepaliveInterval: 30000, // Optional: prevents timeout
  };

//   const forwardOptions = {
//     srcAddr: "127.0.0.1",
//     srcPort: env.ssh.localPort,
//     dstAddr: env.postgres.host,
//     dstPort: env.postgres.port,
//   };

  console.log(
    `Creating SSH tunnel: local:${env.ssh.localPort} → ${env.postgres.host}:${env.postgres.port} via bastion`
  );

  try {
    [tunnelServer, sshClient] = await createTunnel(
      tunnelOptions,
      serverOptions,
      sshOptions,
      forwardOptions
    );

    console.log(`SSH tunnel established on local port ${env.ssh.localPort}`);

    // ONLY close on proper shutdown signals — NOT on "exit"
    process.on("SIGINT", closeTunnel); // Ctrl+C
    process.on("SIGTERM", closeTunnel); // kill, docker stop, etc.

    // REMOVE this line completely:
    // process.on("exit", closeTunnel);
  } catch (error: any) {
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

export function getLocalDbPort(): number {
  return env.ssh.enabled ? env.ssh.localPort : env.postgres.port;
}

export function getLocalDbHost(): string {
  return "127.0.0.1";
}
