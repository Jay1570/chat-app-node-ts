import { UserWithoutPassword } from "@/types/User.ts";

declare module "hono" {
    interface ContextVariableMap {
        user?: UserWithoutPassword;
        wsUser?: UserWithoutPassword;
    }
}
