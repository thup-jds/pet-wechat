import type { Serve, ServerWebSocket } from "bun";
import type { WsMessage } from "shared";

export interface WsConnectionData {
  userId: string;
  lastHeartbeatAt: number;
}

const HEARTBEAT_TIMEOUT_MS = 60_000;
const HEARTBEAT_CHECK_INTERVAL_MS = 30_000;
const userSockets = new Map<string, Set<ServerWebSocket<WsConnectionData>>>();

function addConnection(ws: ServerWebSocket<WsConnectionData>) {
  const { userId } = ws.data;
  const sockets = userSockets.get(userId) ?? new Set<ServerWebSocket<WsConnectionData>>();
  sockets.add(ws);
  userSockets.set(userId, sockets);
}

function removeConnection(ws: ServerWebSocket<WsConnectionData>) {
  const { userId } = ws.data;
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.delete(ws);
  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
}

function parseMessage(rawMessage: string | Buffer): WsMessage | null {
  try {
    const text = typeof rawMessage === "string" ? rawMessage : rawMessage.toString("utf8");
    return JSON.parse(text) as WsMessage;
  } catch {
    return null;
  }
}

function sendMessage(ws: ServerWebSocket<WsConnectionData>, message: WsMessage) {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    removeConnection(ws);
    ws.close();
  }
}

setInterval(() => {
  const now = Date.now();

  for (const sockets of userSockets.values()) {
    for (const socket of sockets) {
      if (now - socket.data.lastHeartbeatAt > HEARTBEAT_TIMEOUT_MS) {
        removeConnection(socket);
        socket.close(1000, "Heartbeat timeout");
      }
    }
  }
}, HEARTBEAT_CHECK_INTERVAL_MS);

export function broadcast(userId: string, message: WsMessage) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  for (const socket of sockets) {
    sendMessage(socket, message);
  }
}

export const wsHandler: NonNullable<Serve.Options<WsConnectionData>["websocket"]> = {
  open(ws) {
    ws.data.lastHeartbeatAt = Date.now();
    addConnection(ws);
  },
  message(ws, rawMessage) {
    const message = parseMessage(rawMessage);
    if (!message) return;

    if (message.type === "ping") {
      ws.data.lastHeartbeatAt = Date.now();
      sendMessage(ws, { type: "pong" });
    }
  },
  close(ws) {
    removeConnection(ws);
  },
};
