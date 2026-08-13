import type { WSContext } from "hono/ws";

const WS_OPEN = 1;

const connections = new Map<string, Set<WSContext>>();

export const registerConnection = (userId: string, ws: WSContext) => {
    const existing = connections.get(userId);
    if (existing) {
        existing.add(ws);
    } else {
        connections.set(userId, new Set([ws]));
    }
};

export const unregisterConnection = (userId: string, ws: WSContext) => {
    const sockets = connections.get(userId);
    if (!sockets) return;

    sockets.delete(ws);
    if (sockets.size === 0) {
        connections.delete(userId);
    }
};

export const sendToUser = (userId: string | string[], payload: unknown) => {
    if (typeof userId !== "string") {
        userId.forEach((u) => sendToUser(u, payload));
        return;
    }

    const sockets = connections.get(userId);
    if (!sockets) return;

    const message = JSON.stringify(payload);
    sockets.forEach((ws) => {
        if (ws.readyState === WS_OPEN) {
            ws.send(message);
        }
    });
};

export const isUserOnline = (userId: string) => {
    return connections.has(userId) && (connections.get(userId)?.size ?? 0) > 0;
};

export const getAllConnections = (): Set<WSContext> => {
    const all = new Set<WSContext>();
    connections.forEach((sockets) => sockets.forEach((ws) => all.add(ws)));
    return all;
};
