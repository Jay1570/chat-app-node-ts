import express, { Router } from "express";
import { authenticateToken } from "../../middlewares/authenticate.middleware.js";
import {
    conversationDirectCreateController,
    conversationListController,
} from "./conversations.controller.js";

const conversationRouter: Router = express.Router();

conversationRouter.get("/", authenticateToken, conversationListController);
conversationRouter.post(
    "/create-direct",
    authenticateToken,
    conversationDirectCreateController,
);

export default conversationRouter;
