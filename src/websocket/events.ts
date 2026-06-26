export const WsEvents = {
    message: {
        new: (conversationId: string) =>
            `conversation:${conversationId}:message:new`,
        updated: (conversationId: string) =>
            `conversation:${conversationId}:message:updated`,
        deleted: (conversationId: string) =>
            `conversation:${conversationId}:message:deleted`,
    },
    conversation: {
        read: (conversationId: string) => `conversation:${conversationId}:read`,
        newRequest: () => `conversation:request:new`,
        requestReviewed: () => `conversation:request:reviewed`,
    },
} as const;
