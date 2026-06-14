import express, { Router } from "express";
import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    conversationListController,
    reviewConversationRequest,
    sendConversationRequest,
} from "@/modules/conversations/conversations.controller.js";

const conversationRouter: Router = express.Router();

conversationRouter.get("/", authenticateToken, conversationListController);

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

export default conversationRouter;
