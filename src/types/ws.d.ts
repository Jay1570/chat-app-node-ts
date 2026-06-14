import "ws";
import { UserWithoutPassword } from "@/types/User.ts";

declare module "ws" {
    interface WebSocket {
        user?: UserWithoutPassword;
        isAlive?: boolean;
    }
}
