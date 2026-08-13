import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    listMessageController,
    sendMessageController,
} from "@/modules/messages/messages.controller.js";
import { Hono } from "hono";

const messageRouter = new Hono();

messageRouter.get("/:conversationId", authenticateToken, listMessageController);

messageRouter.post(
    "/:conversationId",
    authenticateToken,
    sendMessageController,
);

export default messageRouter;
