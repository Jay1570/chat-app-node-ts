import { NextFunction, Response } from "express";
import { AuthRequest } from "@/types/AuthRequest.js";
import { validationError } from "@/core/resultHandlers.js";
import {
    checkConversationAccess,
    getMemberReadStatusService,
} from "@/modules/conversations/conversations.service.js";
import db from "@/db/db.js";
import { validatePayload } from "@/core/validator.js";
import {
    messageCreatePayload,
    messageListPayload,
} from "@/modules/messages/messages.validator.js";
import {
    messageCreateService,
    messageListService,
} from "@/modules/messages/messages.service.js";
import { isUserOnline, sendToUser } from "@/websocket/registry.js";
import { sendResponse } from "@/core/responseHandler.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { enqueueNotification } from "@/queue/notification.producer.js";
import { logger } from "@/core/logger.js";

export const sendMessageController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return next(validationError("Conversation id is required"));
        }
        if (typeof conversationId !== "string") {
            return next(validationError("Invalid conversation id"));
        }

        const payloadValidation = validatePayload(
            messageCreatePayload,
            req.body,
        );
        if (!payloadValidation.success) {
            return next(payloadValidation);
        }

        const conversationAccessResult = await checkConversationAccess(
            req.user!.id,
            conversationId,
            db,
        );
        if (!conversationAccessResult.success) {
            return next(conversationAccessResult);
        }

        const messageResult = await messageCreateService(
            req.user!,
            conversationId,
            payloadValidation.data,
            db,
        );
        if (!messageResult.success) {
            return next(messageResult);
        }

        sendToUser(conversationAccessResult.data.userIds, {
            event: `conversation:${conversationId}:message:new`,
            data: messageResult.data,
        });

        const offlineUserIds = conversationAccessResult.data.userIds.filter(
            (id) => !isUserOnline(id) && id !== req.user!.id,
        );

        console.log("all members:", conversationAccessResult.data.userIds);
        console.log("current user:", req.user!.id);
        console.log(
            "online check results:",
            conversationAccessResult.data.userIds.map((id) => ({
                id,
                online: isUserOnline(id),
            })),
        );
        console.log("offline users:", offlineUserIds);
        

        enqueueNotification("new_message", offlineUserIds, {
            title:
                conversationAccessResult.data.conversation.name ??
                req.user!.name,
            body: `${req.user!.name}: ${payloadValidation.data.content}`,
            data: { conversationId },
        }).catch((e) => logger.error("Failed to enqueue notification:", e));

        return sendResponse(res, {
            success: true,
            message: "Message sent",
            statusCode: HttpStatusCode.OK,
            data: messageResult.data,
        });
    } catch (err) {
        return next(err);
    }
};

export const listMessageController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return next(validationError("Conversation id is required"));
        }
        if (typeof conversationId !== "string") {
            return next(validationError("Invalid conversation id"));
        }

        const messageQueryValidationResult = validatePayload(
            messageListPayload,
            req.query,
        );
        if (!messageQueryValidationResult.success) {
            return next(messageQueryValidationResult);
        }

        const query = messageQueryValidationResult.data;

        const conversationAccessResult = await checkConversationAccess(
            req.user!.id,
            conversationId,
            db,
        );
        if (!conversationAccessResult.success) {
            return next(conversationAccessResult);
        }

        const [messagesListResult, readStatusResult] = await Promise.all([
            messageListService(db, conversationId, query.cursor, query.limit),
            getMemberReadStatusService(db, conversationId),
        ]);
        if (!messagesListResult.success) {
            return next(messagesListResult);
        }
        if (!readStatusResult.success) {
            return next(readStatusResult);
        }

        return sendResponse(res, {
            success: true,
            message: "Messages retrieved successfully",
            statusCode: HttpStatusCode.OK,
            data: {
                messages: messagesListResult.data,
                readStatus: readStatusResult.data,
            },
        });
    } catch (err) {
        return next(err);
    }
};
