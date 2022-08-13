import { action, atom, map } from "nanostores";
import { client } from "./qqclient";
import { Message, MessageElement } from "../types/Message";
import { getClient, request } from "../utils/graphql";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface SelectedChatType {
    id: string,
    title: string,
    avatarUrl: string,
    unread: number,
}

const EMPTY_SELECTED_CHAT = {
    id: "",
    title: "",
    avatarUrl: "",
    unread: 0,
};

const GQL_SUBSCRIPTION_MESSAGE = `#graphql
subscription SubscriptionMessage ($id: String!) {
    message (chatSessionId: $id) {
        recordId
        atMe
        sender
        time
        seq
        rand
        nickname
        message
    }
}`;

const GQL_QUERY_MESSAGE = `#graphql
query QueryMessage ($chatSessionId: String!, $fromRecordId: Int!, $count: Int!) {
    message (chatSessionId: $chatSessionId, fromRecordId: $fromRecordId, count: $count) {
        recordId
        atMe
        sender
        time
        seq
        rand
        nickname
        message
    }
}`;

const GQL_MUTATION_MARK_READ = `#graphql
mutation MarkRead ($chatSessionId: String!) {
    markRead (chatSessionId: $chatSessionId)
}`;

const GQL_MUTATION_SEND_TEXT = `#graphql
mutation SendText ($chatSessionId: String!, $content: String!) {
    sendTextMessage (chatSessionId: $chatSessionId, content: $content)
}`;

const GQL_MUTATION_SEND_IMAGE = `#graphql
mutation SendText ($chatSessionId: String!, $content: String!) {
    sendImageMessage (chatSessionId: $chatSessionId, content: $content)
}`;

const GQL_QUERY_MESSAGE_AVATAR = `#graphql
query QueryAvatar ($sender: String!) {
    messageAvatar (sender: $sender)
}`;

interface GQLSubscriptionMessageResult {
    message?: Message;
}

interface GQLQueryMessageResult {
    message?: Message[];
}

interface GQLMarkReadResult {
    markRead?: boolean;
}

interface GQLSendTextResult {
    sendTextMessage?: boolean;
}

interface GQLSendImageResult {
    sendImageMessage?: boolean;
}

interface GQLQueryMessageAvatarResult {
    messageAvatar?: string;
}

const messageStorage: Record<string, Message[]> = {}; // Message[]元素按照recordId从小到大有序排列

let messageSubscribeCanceler: (() => void) | null = null;
let lastSubscriptionId = 0;
let newSubscriptionId = 1;
const subscribeMessage = () => {
    if (messageSubscribeCanceler) {
        lastSubscriptionId = 0;
        messageSubscribeCanceler();
    }
    const chatSessionId = selectedChatId.get();
    if (chatSessionId === "") return;
    const params = { id: chatSessionId };
    const gqlClient = getClient();
    const subscriptionId = newSubscriptionId++;
    let isFirstResponse = true;
    messageSubscribeCanceler = gqlClient.subscribe<GQLSubscriptionMessageResult>({ query: GQL_SUBSCRIPTION_MESSAGE, variables: params }, {
        next: (value) => {
            if (value.data && value.data.message) {
                if (isFirstResponse) {
                    isFirstResponse = false;
                    lastSubscriptionId = subscriptionId;
                }
                if (insertMessage(chatSessionId, value.data.message) && chatSessionId === selectedChatId.get()) {
                    selectedChatMessages.notify();
                }
            }
        },
        error: (error) => {
            console.error(error);
        },
        complete: async () => {
            if (lastSubscriptionId === subscriptionId) {
                await sleep(30000);
                if (lastSubscriptionId === subscriptionId) subscribeMessage();
            } else {
                messageSubscribeCanceler = null;
            }
        },
    });
};

const insertMessage = (chatId: string, message: Message) => {
    if (chatId in messageStorage) {
        const list = messageStorage[chatId];
        for (let i = list.length - 1; i >= 0; i--) {
            // 从大到小扫描
            const currentMessage = list[i];
            if (currentMessage.recordId === message.recordId) {
                return undefined;
            } else if (currentMessage.recordId < message.recordId) {
                list.splice(i + 1, 0, message);
                return list;
            }
        }
        // 在开头插入
        list.splice(0, 0, message);
        return list;
    }
    return undefined;
};

// exported store
export const selectedChatId = atom("");
export const selectedChat = map<SelectedChatType>(EMPTY_SELECTED_CHAT);
export const selectedChatMessages = atom([] as Message[]);
export const senderAvatars = map<Record<string, string>>({});

// action
export const selectChat = action(selectedChatId, "selectChat", (store, chatId: string) => {
    store.set(chatId);
});

export const fetchMessageBefore: (recordId: number, count?: number) => Promise<void> = action(selectedChatMessages, "fetchMessageBefore", async (store, recordId: number, count = 20) => {
    const chatSessionId = selectedChatId.get();
    count = Math.min(count, 20);
    let startFrom = recordId - count; // 不包括recordId这条
    if (startFrom < 0) {
        count = count + startFrom;
        startFrom = 0;
    }
    const param = {
        chatSessionId,
        fromRecordId: startFrom,
        count,
    };
    const res = await request<GQLQueryMessageResult>(GQL_QUERY_MESSAGE, param);
    if (res.data && res.data.message) {
        let changed = false;
        for (const msg of res.data.message) {
            if (insertMessage(chatSessionId, msg)) {
                changed = true;
            }
        }
        if (changed && chatSessionId === selectedChatId.get()) {
            store.notify();
        }
    }
});

export const updateSenderAvatar = action(senderAvatars, "updateSenderAvatar", async (store, senderId: string) => {
    const res = await request<GQLQueryMessageAvatarResult>(GQL_QUERY_MESSAGE_AVATAR, { sender: senderId });
    if (res.data && res.data.messageAvatar) {
        senderAvatars.setKey(senderId, res.data.messageAvatar);
        return res.data.messageAvatar;
    }
    return undefined;
});

export const markRead = action(selectedChat, "markRead", async () => {
    const chatId = selectedChatId.get();
    const res = await request<GQLMarkReadResult>(GQL_MUTATION_MARK_READ, { chatSessionId: chatId });
    if (res.data && res.data.markRead) {
        return true;
    }
    return false;
});

export const sendTextMessage = action(selectedChatMessages, "sendTextMessage", async (store, content: MessageElement[]) => {
    const params = {
        chatSessionId: selectedChatId.get(),
        content: JSON.stringify(content),
    };
    const res = await request<GQLSendTextResult>(GQL_MUTATION_SEND_TEXT, params);
    if (res.data && res.data.sendTextMessage) {
        return true;
    }
    return false;
});

// event
const computeSelectedChatMessage = (chatId: string) => {
    if (chatId === "") return;
    if (!(chatId in messageStorage)) {
        messageStorage[chatId] = [];
    }
    selectedChatMessages.set(messageStorage[chatId]);
    subscribeMessage();
    markRead();
};
const computeSelectedChat = () => {
    const c = client.get();
    const id = selectedChatId.get();
    if (c.chatSessions && c.chatSessions.length > 0 && id !== "") {
        for (const session of c.chatSessions) {
            if (session.id === id) {
                selectedChat.set(session);
                return;
            }
        }
    }
    selectedChat.set(EMPTY_SELECTED_CHAT);
};
selectedChatId.listen(computeSelectedChatMessage);
selectedChatId.listen(computeSelectedChat);
client.listen(computeSelectedChat);

// debug
