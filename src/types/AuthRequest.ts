import type { Request } from "express";
import type { UserWithoutPassword } from "@/types/User.js";

export interface AuthRequest extends Request {
    user?: UserWithoutPassword;
}
