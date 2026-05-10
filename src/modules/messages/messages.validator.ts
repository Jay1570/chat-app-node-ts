import * as z from "zod";

export const messageCreatePayload = z.object({
    content: z.string(),
});
