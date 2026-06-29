export type NotificationJobType =
    | "new_message"
    | "conversation_request"
    | "request_reviewed";

export type NotificationJob = {
    id: string;
    type: NotificationJobType;
    userIds: string[];
    payload: {
        title: string;
        body: string;
        data?: Record<string, string>;
    };
    attempts: number;
};
