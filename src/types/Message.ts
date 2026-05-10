export type MessageCreatePayload = {
    content: string;
}

export type Message = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    conversationId: string;
    senderId: string;
    content: string;
    isEdited: boolean;
    isDeleted: boolean;
};