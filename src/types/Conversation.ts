import { BasicUser } from "./User.js";

export type ConversationForList = {
    id: string;
    name: string;
    type: ConversationType;
    lastMessage: string | null;
    lastMessageByUserId: string | null;
    lastMessageByUser: BasicUser | null;
    lastMessageAt: string | null;
};

export const ConversationTypes = {
    group: "group",
    direct: "direct",
} as const;

export type ConversationType =
    (typeof ConversationTypes)[keyof typeof ConversationTypes];

export type ConversationListQueryRow = {
    id: string;
    name: string | null;
    type: ConversationType;
    otherUserName: string | null;
    lastMessage: string | null;
    lastMessageByUserId: string | null;
    lastMessageAt: Date | null;
    senderName: string | null;
};
