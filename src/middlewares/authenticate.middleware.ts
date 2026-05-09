import type { NextFunction, Response } from "express";
import {
    getHttpStatusLine,
    sendUnauthorized,
} from "../core/responseHandler.js";
import { verifyToken } from "../utils/jwtHelpers.js";
import { getUserById } from "../modules/users/user.service.js";
import type { AuthRequest } from "../types/AuthRequest.js";
import db from "../db/db.js";
import { HttpStatusCode } from "../config/HttpStatusCodes.js";
import http from "http";
import Stream from "stream";
import webSocketServer from "../websocket/index.js";

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const token = req.headers.authorization;

        if (!token) return sendUnauthorized(res);

        const tokenResult = verifyToken(token);
        if (!tokenResult.success) {
            return next(tokenResult);
        }
        if (!tokenResult.data.id) {
            return sendUnauthorized(res);
        }

        const userResult = await getUserById(tokenResult.data.id, db);
        if (!userResult.success) {
            if (userResult.error.code === 404) {
                return sendUnauthorized(res);
            }
            return next(userResult);
        }

        req.user = userResult.data;

        return next();
    } catch (err) {
        return next(err);
    }
};

export const authenticateWebSocket = async (
    req: http.IncomingMessage,
    socket: Stream.Duplex,
    head: NonSharedBuffer,
) => {
    try {
        const url = new URL(req.url!, "http://localhost");

        if (url.pathname !== "/ws") {
            socket.end();
            return;
        }

        const token = url.searchParams.get("token");

        if (!token) {
            const statusLine = getHttpStatusLine({
                success: false,
                error: {
                    code: HttpStatusCode.UNAUTHORIZED,
                    message: "Unauthorized",
                },
            });
            await socket.end(statusLine);
            return;
        }

        const payload = verifyToken(token);
        if (!payload.success) {
            const statusLine = getHttpStatusLine(payload);
            socket.end(statusLine);
            return
        }

        const userResult = await getUserById(payload.data.id, db);
        if (!userResult.success) {
            const statusLine = getHttpStatusLine(userResult);
            await socket.end(statusLine);
            return;
        }

        req.user = userResult.data;

        webSocketServer.handleUpgrade(req, socket, head, (ws) => {
            ws.user = userResult.data;
            webSocketServer.emit("connection", ws, req);
        });
    } catch {
        const statusLine = getHttpStatusLine({
            success: false,
            error: {
                code: HttpStatusCode.UNAUTHORIZED,
                message: "Unauthorized",
            },
        });
        socket.end(statusLine);
    }
};
