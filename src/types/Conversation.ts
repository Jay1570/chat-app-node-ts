import { BasicUser } from "./User.js";

export type ConversationForList = {
    id: string;
    name: string;
    type: ConversationType;
    lastMessage: string | null;
    lastMessageByUserId: string | null;
    lastMessageByUser: BasicUser | null;
    lastMessageAt: string | null;
    unreadCount: number;
    otherUsers: BasicUser[];
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
    otherUserId: string | null;
    otherUserName: string | null;
    lastMessage: string | null;
    lastMessageByUserId: string | null;
    lastMessageAt: Date | null;
    senderName: string | null;
    unreadCount: number | null;
};

export type RequestConversationPayload = {
    userIds: string[];
    conversationType: ConversationType;
    conversationName?: string | null | undefined;
};
