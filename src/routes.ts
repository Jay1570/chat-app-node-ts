import express, { Router } from "express";
import userRouter from "./modules/users/user.routes.js";
import conversationRouter from "./modules/conversations/conversation.routes.js";
import messageRouter from "./modules/messages/messages.routes.js";

const router: Router = express.Router();

router.use("/users", userRouter);
router.use("/conversations", conversationRouter);
router.use("/messages", messageRouter);

export default router;
