import * as z from "zod";

export const messageCreatePayload = z.object({
    content: z.string(),
});

export const messageListPayload = z.object({
    cursor: z.iso.datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});
