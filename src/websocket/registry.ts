import WebSocket from "ws";
import http from "http";

const connections = new Map<string, Set<WebSocket>>();

export const connectionRegistry = (ws: WebSocket, _req: http.IncomingMessage) => {
    const userId = ws.user!.id;

    const existing = connections.get(userId);

    if (existing) {
        existing.add(ws);
    } else {
        connections.set(userId, new Set([ws]));
    }

    ws.on("close", () => {
        const sockets = connections.get(userId);

        if (!sockets) return;

        sockets.delete(ws);

        if (sockets.size === 0) {
            connections.delete(userId);
        }

        console.log("online users:", connections.size);
    });
};
