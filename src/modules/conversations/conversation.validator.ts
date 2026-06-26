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

export const conversationListPayload = z.object({
    search: z.string().optional(),
    cursor: z.iso.datetime().optional(), // lastMessageAt of last item
    cursorId: z.uuid().optional(), // id of last item (tie-breaker)
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const conversationRequestListPayload = z.object({
    cursor: z.iso.datetime().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});
