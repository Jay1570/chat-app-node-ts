import { authenticateToken } from "@/middlewares/authenticate.middleware.js";
import {
    currentUser,
    loginUser,
    registerUser,
    refreshTokens,
    logoutUser,
    updateFcmToken,
    discoverUsersController,
} from "@/modules/users/users.controller.js";
import { Hono } from "hono";

const userRouter = new Hono();

userRouter.get("/me", authenticateToken, currentUser);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh", refreshTokens);
userRouter.post("/logout", authenticateToken, logoutUser);
userRouter.post("/fcm-token", authenticateToken, updateFcmToken);
userRouter.post("/discover", authenticateToken, discoverUsersController);

export default userRouter;

