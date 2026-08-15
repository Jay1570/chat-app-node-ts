import {
    checkConversationAccess,
    conversationListService,
    getConversationRequestsService,
    markConversationAsReadService,
    reviewConversationRequestService,
    sendConversationRequestService,
} from "@/modules/conversations/conversations.service.js";
import db from "@/db/db.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { sendResponse } from "@/core/responseHandler.js";
import {
    conversationRequestPayload,
    reviewConversationRequestPayload,
    conversationListPayload,
    conversationRequestListPayload,
} from "@/modules/conversations/conversation.validator.js";
import { validatePayload } from "@/core/validator.js";
import { validationError } from "@/core/resultHandlers.js";
import { sendToUser } from "@/websocket/registry.js";
import { WsEvents } from "@/websocket/events.js";
import { enqueueNotification } from "@/queue/notification.producer.js";
import { logger } from "@/core/logger.js";
import { AppError } from "@/types/Result.js";
import type { MiddlewareHandler } from "hono";

export const conversationListController: MiddlewareHandler = async (c) => {
    const validateQueryResult = validatePayload(
        conversationListPayload,
        c.req.query(),
    );
    if (!validateQueryResult.success) {
        throw new AppError(validateQueryResult);
    }

    const query = validateQueryResult.data;
    const user = c.get("user")!;

    const conversationListResult = await conversationListService(
        user.id,
        query.search || null,
        query.cursor || null,
        query.cursorId || null,
        query.limit,
        db,
    );
    if (!conversationListResult.success) {
        throw new AppError(conversationListResult);
    }

    return sendResponse(c, {
        success: true,
        message: "Conversation list fetched successfully",
        statusCode: HttpStatusCode.OK,
        data: conversationListResult.data,
    });
};

export const sendConversationRequest: MiddlewareHandler = async (c) => {
    const payload = await c.req.json();
    const user = c.get("user")!;

    const validationResult = validatePayload(
        conversationRequestPayload,
        payload,
    );
    if (!validationResult.success) {
        throw new AppError(validationResult);
    }

    const createConversationResult = await sendConversationRequestService(
        user.id,
        validationResult.data,
        db,
    );
    if (!createConversationResult.success) {
        throw new AppError(createConversationResult);
    }

    sendToUser(validationResult.data.userIds, {
        event: WsEvents.conversation.newRequest(),
        data: createConversationResult.data,
    });

    const conversation = createConversationResult.data;

    enqueueNotification("conversation_request", validationResult.data.userIds, {
        title: "New conversation request",
        body: `${user.name} requested to chat with you`,
        data: { conversationId: conversation.id },
    }).catch((e) => logger.error("Failed to enqueue notification:", e));

    return sendResponse(c, {
        success: true,
        statusCode: HttpStatusCode.CREATED,
        data: createConversationResult.data,
        message: "Conversation created successfully",
    });
};

export const reviewConversationRequest: MiddlewareHandler = async (c) => {
    const payload = await c.req.json();
    const user = c.get("user")!;

    const validationResult = validatePayload(
        reviewConversationRequestPayload,
        payload,
    );
    if (!validationResult.success) {
        throw new AppError(validationResult);
    }

    const result = await reviewConversationRequestService(
        user.id,
        validationResult.data,
        db,
    );
    if (!result.success) {
        throw new AppError(result);
    }

    enqueueNotification("request_reviewed", [result.data.senderId], {
        title:
            validationResult.data.status === "approve"
                ? "Request accepted"
                : "Request declined",
        body: `${user.name} ${validationResult.data.status === "approve" ? "accepted" : "declined"} your request`,
        data: { conversationId: validationResult.data.requestId },
    }).catch((e) => logger.error("Failed to enqueue notification:", e));

    return sendResponse(c, {
        success: true,
        message: `Request ${validationResult.data.status} successfully`,
        statusCode: HttpStatusCode.OK,
    });
};

export const markAsReadController: MiddlewareHandler = async (c) => {
    const conversationId = c.req.param("conversationId");
    if (!conversationId) {
        throw new AppError(validationError("Conversation id is required"));
    }

    const user = c.get("user")!;

    const accessResult = await checkConversationAccess(
        user.id,
        conversationId,
        db,
    );
    if (!accessResult.success) throw new AppError(accessResult);

    const result = await markConversationAsReadService(
        user.id,
        conversationId,
        db,
    );
    if (!result.success) throw new AppError(result);

    sendToUser(accessResult.data.userIds, {
        event: WsEvents.conversation.read(conversationId),
        data: { userId: user.id, readAt: new Date() },
    });

    return sendResponse(c, {
        success: true,
        message: "Marked as read",
        statusCode: HttpStatusCode.OK,
    });
};

export const listConversationRequestsController: MiddlewareHandler = async (c) => {
    const user = c.get("user")!;

    const queryValidation = validatePayload(
        conversationRequestListPayload,
        c.req.query(),
    );
    if (!queryValidation.success) throw new AppError(queryValidation);

    const result = await getConversationRequestsService(
        user.id,
        db,
        queryValidation.data.cursor,
        queryValidation.data.limit,
    );
    if (!result.success) throw new AppError(result);

    return sendResponse(c, {
        success: true,
        message: "Conversation requests retrieved",
        statusCode: HttpStatusCode.OK,
        data: result.data,
    });
};
