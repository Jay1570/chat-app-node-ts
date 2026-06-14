import express, { Router } from "express";
import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import { sendMessageController } from "@/modules/messages/messages.controller.js";

const messageRouter: Router = express.Router();

messageRouter.post(
    "/:conversationId",
    authenticateToken,
    sendMessageController,
);

export default messageRouter;
