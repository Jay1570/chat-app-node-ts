import express, { Router } from "express";
import { authenticateToken } from "../../middlewares/authenticate.middleware.js";
import { sendMessageController } from "./messages.controller.js";

const messageRouter: Router = express.Router();

messageRouter.post(
    "/:conversationId",
    authenticateToken,
    sendMessageController,
);

export default messageRouter;
