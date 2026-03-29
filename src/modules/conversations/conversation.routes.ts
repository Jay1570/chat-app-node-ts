import express, { Router } from "express";
import { authenticateToken } from "../../middlewares/authenticate.middleware.js";
import {
    conversationListController,
    sendConversationRequest,
} from "./conversations.controller.js";

const conversationRouter: Router = express.Router();

conversationRouter.get("/", authenticateToken, conversationListController);
conversationRouter.post(
    "/send-request",
    authenticateToken,
    sendConversationRequest,
);

export default conversationRouter;
