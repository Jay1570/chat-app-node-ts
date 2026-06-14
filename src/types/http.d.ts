import "http";
import { UserWithoutPassword } from "@/types/User.ts";

declare module "http" {
    interface IncomingMessage {
        user?: UserWithoutPassword;
        isAlive?: boolean;
    }
}
