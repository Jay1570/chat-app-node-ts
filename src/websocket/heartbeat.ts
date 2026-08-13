import type { WSContext } from "hono/ws";
import { logger } from "@/core/logger.js";
import { getAllConnections } from "@/websocket/registry.js";

const WS_OPEN = 1;
const HEARTBEAT_INTERVAL_MS = 30000;

const aliveMap = new WeakMap<WSContext, boolean>();

export const initHeartbeat = (ws: WSContext) => {
    aliveMap.set(ws, true);
};

export const handlePong = (ws: WSContext) => {
    aliveMap.set(ws, true);
};

let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

export const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
        getAllConnections().forEach((ws) => {
            if (ws.readyState !== WS_OPEN) return;

            if (aliveMap.get(ws) === false) {
                logger.info("Terminating dead socket");
                ws.close();
                return;
            }

            aliveMap.set(ws, false);
            ws.send("ping");
        });
    }, HEARTBEAT_INTERVAL_MS);
};

export const stopHeartbeat = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
};
