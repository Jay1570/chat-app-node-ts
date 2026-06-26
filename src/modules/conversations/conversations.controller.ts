import { AuthRequest } from "@/types/AuthRequest.js";
import type { NextFunction, Response } from "express";
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

export const conversationListController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const validateQueryResult = validatePayload(
            conversationListPayload,
            req.query,
        );
        if (!validateQueryResult.success) {
            return next(validateQueryResult);
        }

        const query = validateQueryResult.data;

        const conversationListResult = await conversationListService(
            req.user!.id,
            query.search || null,
            query.cursor || null,
            query.cursorId || null,
            query.limit,
            db,
        );
        if (!conversationListResult.success) {
            return next(conversationListResult);
        }

        return sendResponse(res, {
            success: true,
            message: "Conversation list fetched successfully",
            statusCode: HttpStatusCode.OK,
            data: conversationListResult.data,
        });
    } catch (err) {
        return next(err);
    }
};

export const sendConversationRequest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const payload = req.body;

        const validationResult = validatePayload(
            conversationRequestPayload,
            payload,
        );
        if (!validationResult.success) {
            return next(validationResult);
        }

        const createConversationResult = await sendConversationRequestService(
            req.user!.id,
            validationResult.data,
            db,
        );
        if (!createConversationResult.success) {
            return next(createConversationResult);
        }

        sendToUser(validationResult.data.userIds, {
            event: WsEvents.conversation.newRequest(),
            data: createConversationResult.data,
        });

        return sendResponse(res, {
            success: true,
            statusCode: HttpStatusCode.CREATED,
            data: createConversationResult.data,
            message: "Conversation created successfully",
        });
    } catch (err) {
        return next(err);
    }
};

export const reviewConversationRequest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const validationResult = validatePayload(
            reviewConversationRequestPayload,
            req.body,
        );
        if (!validationResult.success) {
            return next(validationResult);
        }

        const result = await reviewConversationRequestService(
            req.user!.id,
            validationResult.data,
            db,
        );
        if (!result.success) {
            return next(result);
        }

        return sendResponse(res, {
            success: true,
            message: `Request ${validationResult.data.status} successfully`,
            statusCode: HttpStatusCode.OK,
        });
    } catch (err) {
        return next(err);
    }
};

export const markAsReadController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    const { conversationId } = req.params;
    if (!conversationId) {
        return next(validationError("Conversation id is required"));
    }
    if (typeof conversationId !== "string") {
        return next(validationError("Invalid conversation id"));
    }

    const user = req.user!;

    const accessResult = await checkConversationAccess(
        user.id,
        conversationId,
        db,
    );
    if (!accessResult.success) return next(accessResult);

    const result = await markConversationAsReadService(
        user.id,
        conversationId,
        db,
    );
    if (!result.success) return next(result);

    sendToUser(accessResult.data.userIds, {
        event: WsEvents.conversation.read(conversationId),
        data: { userId: user.id, readAt: new Date() },
    });

    return sendResponse(res, {
        success: true,
        message: "Marked as read",
        statusCode: HttpStatusCode.OK,
    });
};

export const listConversationRequestsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    const queryValidation = validatePayload(
        conversationRequestListPayload,
        req.query,
    );
    if (!queryValidation.success) return next(queryValidation);

    const result = await getConversationRequestsService(
        req.user!.id,
        db,
        queryValidation.data.cursor,
        queryValidation.data.limit,
    );
    if (!result.success) return next(result);

    return sendResponse(res, {
        success: true,
        message: "Conversation requests retrieved",
        statusCode: HttpStatusCode.OK,
        data: result.data,
    });
};
