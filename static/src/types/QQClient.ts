export interface ChatSession {
    id: string;
    unread: number;
    title: string;
    avatarUrl: string;
}

export interface QQClient {
    id?: string;
    qid?: string;
    isOnline?: boolean;
    loginImage?: string;
    loginError?: string;
    chatSessions?: Array<ChatSession>
}
