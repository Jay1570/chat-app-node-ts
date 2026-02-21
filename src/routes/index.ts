import express, { Router } from "express";
import userRouter from "./user.routes.js";

const router: Router = express.Router();

router.use("/users", userRouter);

export default router;
