import { h } from "preact";
import { usePartStore } from "../../hooks/partStore";
import { selectedChat as selectedChatStore } from "../../stores";
import { SelectedChatType } from "../../stores/message";
import Editor from "./Editor";
import MessageList from "./Message";

const SELECTED_CHAT_ATTR_LIST = ["id"] as (keyof SelectedChatType)[];

const ChatFrame: () => h.JSX.Element = () => {
    const selectedChat = usePartStore<SelectedChatType>(selectedChatStore, SELECTED_CHAT_ATTR_LIST);

    return selectedChat.id ? <div class="w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div class="flex-auto overflow-hidden">
            <MessageList />
        </div>
        <div class="flex-shrink-0 w-full border-t">
            <Editor />
        </div>
    </div> : <div class="w-full h-full flex justify-center items-center">未选择会话</div>;
};
export default ChatFrame;
