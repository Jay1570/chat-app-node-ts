import express, { Router } from "express";
import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    currentUser,
    loginUser,
    registerUser,
    refreshTokens,
    logoutUser,
    updateFcmToken,
} from "@/modules/users/users.controller.js";

const userRouter: Router = express.Router();

userRouter.get("/me", authenticateToken, currentUser);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh", refreshTokens);
userRouter.post("/logout", authenticateToken, logoutUser);
userRouter.post("/fcm-token", authenticateToken, updateFcmToken);

export default userRouter;

