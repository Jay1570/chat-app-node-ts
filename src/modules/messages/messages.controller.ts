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
import { AppError } from "@/types/Result.js";
import { MiddlewareHandler } from "hono";

export const sendMessageController: MiddlewareHandler = async (c) => {
    const conversationId = c.req.param("conversationId");

    if (!conversationId) {
        throw new AppError(validationError("Conversation id is required"));
    }
    if (typeof conversationId !== "string") {
        throw new AppError(validationError("Invalid conversation id"));
    }

    const body = await c.req.json();
    const user = c.get("user")!;

    const payloadValidation = validatePayload(messageCreatePayload, body);
    if (!payloadValidation.success) {
        throw new AppError(payloadValidation);
    }

    const conversationAccessResult = await checkConversationAccess(
        user.id,
        conversationId,
        db,
    );
    if (!conversationAccessResult.success) {
        throw new AppError(conversationAccessResult);
    }

    const messageResult = await messageCreateService(
        user,
        conversationId,
        payloadValidation.data,
        db,
    );
    if (!messageResult.success) {
        throw new AppError(messageResult);
    }

    sendToUser(conversationAccessResult.data.userIds, {
        event: `conversation:${conversationId}:message:new`,
        data: messageResult.data,
    });

    const offlineUserIds = conversationAccessResult.data.userIds.filter(
        (id) => !isUserOnline(id) && id !== user.id,
    );

    enqueueNotification("new_message", offlineUserIds, {
        title: conversationAccessResult.data.conversation.name ?? user.name,
        body: `${user.name}: ${payloadValidation.data.content}`,
        data: { conversationId },
    }).catch((e) => logger.error("Failed to enqueue notification:", e));

    return sendResponse(c, {
        success: true,
        message: "Message sent",
        statusCode: HttpStatusCode.OK,
        data: messageResult.data,
    });
};

export const listMessageController: MiddlewareHandler = async (c) => {
    const conversationId = c.req.param("conversationId");

    if (!conversationId) {
        throw new AppError(validationError("Conversation id is required"));
    }
    if (typeof conversationId !== "string") {
        throw new AppError(validationError("Invalid conversation id"));
    }

    const messageQueryValidationResult = validatePayload(
        messageListPayload,
        c.req.query(),
    );
    if (!messageQueryValidationResult.success) {
        throw new AppError(messageQueryValidationResult);
    }

    const query = messageQueryValidationResult.data;

    const user = c.get("user")!;

    const conversationAccessResult = await checkConversationAccess(
        user.id,
        conversationId,
        db,
    );
    if (!conversationAccessResult.success) {
        throw new AppError(conversationAccessResult);
    }

    const [messagesListResult, readStatusResult] = await Promise.all([
        messageListService(db, conversationId, query.cursor, query.limit),
        getMemberReadStatusService(db, conversationId),
    ]);
    if (!messagesListResult.success) {
        throw new AppError(messagesListResult);
    }
    if (!readStatusResult.success) {
        throw new AppError(readStatusResult);
    }

    return sendResponse(c, {
        success: true,
        message: "Messages retrieved successfully",
        statusCode: HttpStatusCode.OK,
        data: {
            messages: messagesListResult.data,
            readStatus: readStatusResult.data,
            conversation: conversationAccessResult.data.conversation,
        },
    });
};
