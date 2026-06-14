import { WebSocketServer } from "ws";
import { connectionRegistry } from "@/websocket/registry.js";
import { heartBeatConnection } from "@/websocket/heartbeat.js";

const webSocketServer = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024,
});

webSocketServer.on("connection", connectionRegistry);
webSocketServer.on("connection", heartBeatConnection);

const heartbeatInterval = setInterval(() => {
    webSocketServer.clients.forEach((ws) => {
        const client = ws;

        if (client.readyState !== client.OPEN) {
            return;
        }

        if (!client.isAlive) {
            console.log("Terminating dead socket");

            client.terminate();

            return;
        }

        client.isAlive = false;

        client.ping();
    });
}, 30000);

webSocketServer.on("close", () => {
    clearInterval(heartbeatInterval);
});

export default webSocketServer;
