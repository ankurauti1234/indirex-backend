// src/api/remote-access/remote-access.websocket.ts
import { WebSocketServer, WebSocket } from "ws";
import { RemoteAccessService } from "../../services/remote-access/remote-access.service";

const service = new RemoteAccessService();

interface Conn {
  conn: any;
  stream: any;
  logId: string;
  ws: WebSocket;
}

const connections = new Map<WebSocket, Conn>();

export function setupRemoteAccessWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req) => {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    ws.on("message", async (raw) => {
      let data: any;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return ws.send(
          JSON.stringify({ type: "error", error: "Invalid JSON" })
        );
      }

      // CONNECT
      if (data.type === "connect") {
        const { meterId, port, userId } = data;
        if (!meterId || !port || !userId) {
          return ws.send(
            JSON.stringify({ type: "error", error: "Missing fields" })
          );
        }

        try {
          const { conn, stream, logId } = await service.startTunnel(
            meterId,
            port,
            userId,
            clientIp,
            userAgent
          );

          connections.set(ws, { conn, stream, logId, ws });

          stream.on("data", (d: Buffer) =>
            ws.send(JSON.stringify({ type: "output", data: d.toString() }))
          );

          stream.on("close", async () => {
            await service.endTunnel(logId);
            ws.send(JSON.stringify({ type: "disconnected" }));
            connections.delete(ws);
            conn.end();
          });

          ws.send(JSON.stringify({ type: "connected" }));
        } catch (e: any) {
          ws.send(JSON.stringify({ type: "error", error: e.message }));
        }
      }

      // INPUT
      if (data.type === "input") {
        const c = connections.get(ws);
        if (c) c.stream.write(data.data);
      }

      // RESIZE
      if (data.type === "resize") {
        const c = connections.get(ws);
        if (c && c.stream.setWindow) {
          c.stream.setWindow(data.rows, data.cols);
        }
      }

      // DISCONNECT
      if (data.type === "disconnect") {
        const c = connections.get(ws);
        if (c) {
          await service.endTunnel(c.logId);
          c.stream.end();
          c.conn.end();
          connections.delete(ws);
        }
      }
    });

    ws.on("close", async () => {
      const c = connections.get(ws);
      if (c) {
        await service.endTunnel(c.logId);
        c.stream.end();
        c.conn.end();
        connections.delete(ws);
      }
    });
  });
}
