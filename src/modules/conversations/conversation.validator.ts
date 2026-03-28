import * as z from "zod";
import { Result } from "../../types/Result.js";
import { validationError } from "../../core/resultHandlers.js";
import { normalizeZodError } from "../../utils/formatters.js";

const conversationDirectCreateSchema = z.object({
    userId: z.uuid(),
});

export const validateconversationDirectCreatePayload = (
    payload: unknown,
): Result<{ userId: string }> => {
    const result = conversationDirectCreateSchema.safeParse(payload);
    if (!result.success) {
        return validationError(normalizeZodError(result.error));
    }

    return {
        success: true,
        data: result.data,
    };
};
