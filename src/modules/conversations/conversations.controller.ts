import { AuthRequest } from "@/types/AuthRequest.js";
import type { NextFunction, Response } from "express";
import {
    conversationListService,
    reviewConversationRequestService,
    sendConversationRequestService,
} from "@/modules/conversations/conversations.service.js";
import db from "@/db/db.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { sendResponse } from "@/core/responseHandler.js";
import { validationError } from "@/core/resultHandlers.js";
import {
    conversationRequestPayload,
    reviewConversationRequestPayload,
} from "@/modules/conversations/conversation.validator.js";
import { validatePayload } from "@/core/validator.js";

export const conversationListController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { search } = req.query;

        if (search && typeof search !== "string") {
            return next(validationError("Invalid value for search"));
        }

        const conversationListResult = await conversationListService(
            req.user!.id,
            search || null,
            db,
        );
        if (!conversationListResult.success) {
            return next(conversationListResult.error);
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
