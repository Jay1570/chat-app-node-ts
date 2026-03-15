import { ZodError } from "zod";

export const normalizeZodError = (err: ZodError): string => {
    return err.issues
        .map((issue) => {
            const path = issue.path.join(".");
            return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("\n");
};
