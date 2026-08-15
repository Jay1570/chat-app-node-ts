import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    conversationListController,
    listConversationRequestsController,
    markAsReadController,
    reviewConversationRequest,
    sendConversationRequest,
} from "@/modules/conversations/conversations.controller.js";
import { Hono } from "hono";

const conversationRouter = new Hono();

conversationRouter.get("/", authenticateToken, conversationListController);

conversationRouter.get(
    "/requests",
    authenticateToken,
    listConversationRequestsController,
);

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

conversationRouter.patch(
    "/:conversationId/read",
    authenticateToken,
    markAsReadController,
);

export default conversationRouter;
