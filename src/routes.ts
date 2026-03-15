import express, { Router } from "express";
import userRouter from "./modules/users/user.routes.js";

const router: Router = express.Router();

router.use("/users", userRouter);

export default router;
