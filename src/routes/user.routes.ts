import express, { Router } from "express";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";
import {
    currentUser,
    loginUser,
    registerUser,
} from "../controllers/users.controller.js";

const userRouter: Router = express.Router();

userRouter.get("/me", authenticateToken, currentUser);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

export default userRouter;
