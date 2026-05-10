import { internalError } from "../../core/resultHandlers.js";
import { DB } from "../../db/db.js";
import { messagesTable } from "../../db/schemas/messages.schema.js";
import { Message, MessageCreatePayload } from "../../types/Message.js";
import { Result } from "../../types/Result.js";

const module = "messages.service";

export const createMessageService = async (
    userId: string,
    conversationId: string,
    payload: MessageCreatePayload,
    db: DB,
): Promise<Result<Message>> => {
    try {
        const [message] = await db
            .insert(messagesTable)
            .values({
                content: payload.content,
                senderId: userId,
                conversationId: conversationId,
            })
            .returning();
        if (!message) {
            return internalError(module, "createMessageService");
        }

        return {
            success: true,
            data: message,
        };
    } catch (err) {
        return internalError(module, "createMessageService", err);
    }
};
