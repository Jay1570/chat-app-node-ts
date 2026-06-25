import { NextFunction, Response } from "express";
import { AuthRequest } from "@/types/AuthRequest.js";
import { validationError } from "@/core/resultHandlers.js";
import { checkConversationAccess } from "@/modules/conversations/conversations.service.js";
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
import { sendToUser } from "@/websocket/registry.js";
import { sendResponse } from "@/core/responseHandler.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";

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

        const payloadValidation = validatePayload(
            messageCreatePayload,
            req.body,
        );
        if (!payloadValidation.success) {
            return next(payloadValidation);
        }

        const conversationAccessResult = await checkConversationAccess(
            req.user!.id,
            conversationId as string,
            db,
        );
        if (!conversationAccessResult.success) {
            return next(conversationAccessResult);
        }

        const messageResult = await messageCreateService(
            req.user!,
            conversationId as string,
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
            conversationId as string,
            db,
        );
        if (!conversationAccessResult.success) {
            return next(conversationAccessResult);
        }

        const messagesListResult = await messageListService(
            db,
            conversationId as string,
            query.cursor,
            query.limit,
        );
        if (!messagesListResult.success) {
            return next(messagesListResult);
        }

        return sendResponse(res, {
            success: true,
            message: "Messages retrieved successfully",
            statusCode: HttpStatusCode.OK,
            data: messagesListResult.data,
        });
    } catch (err) {
        return next(err);
    }
};
