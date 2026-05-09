import "http";
import { UserWithoutPassword } from "./User.ts";

declare module "http" {
    interface IncomingMessage {
        user?: UserWithoutPassword;
        isAlive?: boolean;
    }
}
