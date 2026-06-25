import express, { Router } from "express";
import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    listMessageController,
    sendMessageController,
} from "@/modules/messages/messages.controller.js";

const messageRouter: Router = express.Router();

messageRouter.get("/:conversationId", authenticateToken, listMessageController);

messageRouter.post(
    "/:conversationId",
    authenticateToken,
    sendMessageController,
);

export default messageRouter;
