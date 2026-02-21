import express, { Router } from "express";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const userRouter: Router = express.Router();

userRouter.get("/me", authenticateToken);

export default userRouter;
