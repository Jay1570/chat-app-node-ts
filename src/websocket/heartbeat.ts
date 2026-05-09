import WebSocket from "ws";
import http from "http";

export const heartBeatConnection = (
    ws: WebSocket,
    _req: http.IncomingMessage,
) => {
    ws.isAlive = true;

    ws.on("pong", () => {
        ws.isAlive = true;
    });
};
