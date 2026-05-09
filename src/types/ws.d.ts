import "ws";
import { UserWithoutPassword } from "./User.ts";

declare module "ws" {
    interface WebSocket {
        user?: UserWithoutPassword;
        isAlive?: boolean;
    }
}
