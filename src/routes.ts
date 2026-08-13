import userRouter from "@/modules/users/user.routes.js";
import conversationRouter from "@/modules/conversations/conversation.routes.js";
import messageRouter from "@/modules/messages/messages.routes.js";
import { Hono } from "hono";

const router = new Hono();

router.route("/users", userRouter);
router.route("/conversations", conversationRouter);
router.route("/messages", messageRouter);

export default router;
