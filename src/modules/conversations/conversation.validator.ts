import * as z from "zod/v4";

export const conversationRequestPayload = z
    .object({
        userIds: z
            .array(z.uuid())
            .min(1, "Please provide at least 1 userId")
            .refine((items) => new Set(items).size === items.length, {
                message:
                    "All items must be unique, no duplicate values allowed", // Custom error message
            }),
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

export const reviewConversationRequestPayload = z.object({
    requestId: z.uuid(),
    status: z.enum(["approve", "reject"]),
});
