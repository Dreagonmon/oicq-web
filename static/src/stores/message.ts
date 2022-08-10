import { action, atom, map } from "nanostores";
import { client } from "./qqclient";
// import { Message } from "../types/Message";

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

export const selectedChatId = atom("");
export const selectedChat = map<SelectedChatType>(EMPTY_SELECTED_CHAT);

// action
export const selectChat = action(selectedChatId, "selectChat", (store, chatId: string) => {
    store.set(chatId);
});

// event
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
selectedChatId.listen(computeSelectedChat);
client.listen(computeSelectedChat);
