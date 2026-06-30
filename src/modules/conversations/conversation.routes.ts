import express, { Router } from "express";
import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    conversationListController,
    listConversationRequestsController,
    markAsReadController,
    reviewConversationRequest,
    sendConversationRequest,
} from "@/modules/conversations/conversations.controller.js";

const conversationRouter: Router = express.Router();

conversationRouter.get("/", authenticateToken, conversationListController);

conversationRouter.get("/requests", authenticateToken, listConversationRequestsController);

conversationRouter.post(
    "/send-request",
    authenticateToken,
    sendConversationRequest,
);

conversationRouter.post(
    "/review-request",
    authenticateToken,
    reviewConversationRequest,
);

conversationRouter.patch("/:conversationId/read", markAsReadController);

export default conversationRouter;
