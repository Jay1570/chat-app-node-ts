import { BasicUser } from "@/types/User.js";

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

export const ConversationRequestStatuses = {
    approve: "approve",
    reject: "reject",
} as const;

export type ConversationType =
    (typeof ConversationTypes)[keyof typeof ConversationTypes];

export type ConversationRequestStatus =
    (typeof ConversationRequestStatuses)[keyof typeof ConversationRequestStatuses];

export type ConversationListQueryRow = {
    id: string;
    name: string | null;
    type: ConversationType;
    otherUserId: string | null;
    otherUserName: string | null;
    otherUserImageUrl: string | null;
    lastMessage: string | null;
    lastMessageByUserId: string | null;
    lastMessageAt: Date | null;
    senderName: string | null;
    senderImageUrl: string | null;
    unreadCount: number | null;
};

export type BasicConversation = Pick<ConversationListQueryRow, "id" | "name" | "type">;

export type RequestConversationPayload = {
    userIds: string[];
    conversationType: ConversationType;
    conversationName?: string | null | undefined;
};

export type ReviewConversationRequestPayload = {
    requestId: string;
    status: ConversationRequestStatus;
};

export type ConversationRequest = {
    createdAt: Date;
    updatedAt: Date;
    id: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
};

export type ConversationRequestForList = ConversationRequest & {
    sender: BasicUser;
    conversation: BasicConversation;
};

export type DeleteConversationMemberPayload =
    | {
        userId: string;
        conversationId: string;
    }
    | {
        conversationMemberId: string;
    };
