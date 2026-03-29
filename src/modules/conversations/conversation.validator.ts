import * as z from "zod";
import { Result } from "../../types/Result.js";
import { validationError } from "../../core/resultHandlers.js";
import { normalizeZodError } from "../../utils/formatters.js";
import { RequestConversationPayload } from "../../types/Conversation.js";

const conversationRequestSchema = z
    .object({
        userIds: z.array(z.uuid()).min(1, "Please provide at least 1 userId"),
        conversationType: z.enum(["group", "direct"]),
        conversationName: z
            .union([z.string().trim().min(1, "Required"), z.null()])
            .optional(),
    })
    .superRefine((payload, ctx) => {
        if (
            payload.conversationType === "direct" &&
            payload.userIds.length > 1
        ) {
            ctx.addIssue({
                code: "custom",
                message:
                    "Only 1 userId is allowed when conversationType is direct",
                path: ["userIds"],
            });
        }

        if (payload.conversationType === "group" && !payload.conversationName) {
            ctx.addIssue({
                code: "custom",
                message:
                    "conversationName is required when conversationType is group",
                path: ["conversationName"],
            });
        }
    });

export const validateConversationRequestPayload = (
    payload: unknown,
): Result<RequestConversationPayload> => {
    const result = conversationRequestSchema.safeParse(payload);
    if (!result.success) {
        return validationError(normalizeZodError(result.error));
    }

    return {
        success: true,
        data: result.data,
    };
};
