import { BasicUser } from "@/types/User.js";

export type MessageCreatePayload = {
    content: string;
};

export type Message = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    conversationId: string;
    senderId: string;
    sender: BasicUser | null;
    content: string;
    isEdited: boolean;
    isDeleted: boolean;
};
