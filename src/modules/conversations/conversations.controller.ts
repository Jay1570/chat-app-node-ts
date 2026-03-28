import { AuthRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Response } from "express";
import {
    conversationDirectCreateService,
    conversationListService,
} from "./conversations.service.js";
import db from "../../db/db.js";
import { HttpStatusCode } from "../../config/HttpStatusCodes.js";
import { sendResponse } from "../../core/responseHandler.js";
import { validationError } from "../../core/resultHandlers.js";
import { validateconversationDirectCreatePayload } from "./conversation.validator.js";

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

export const conversationDirectCreateController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const payload = req.body;

        const validationResult =
            validateconversationDirectCreatePayload(payload);
        if (!validationResult.success) {
            return next(validationResult);
        }

        const reqBody = validationResult.data;

        const createConversationResult = await conversationDirectCreateService(
            req.user!.id,
            reqBody.userId,
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
