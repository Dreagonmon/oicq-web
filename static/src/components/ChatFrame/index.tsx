import { h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { usePartStore } from "../../hooks/partStore";
import { selectedChat as selectedChatStore } from "../../stores";
import { SelectedChatType } from "../../stores/message";
import { onPasteImage } from "../../utils/htmlevent";

const SELECTED_CHAT_ATTR_LIST = ["id"] as (keyof SelectedChatType)[];

const ChatFrame: () => h.JSX.Element = () => {
    const [expand, setExpand] = useState(false);
    const textareaElement = useRef<HTMLTextAreaElement>(null);
    const selectedChat = usePartStore<SelectedChatType>(selectedChatStore, SELECTED_CHAT_ATTR_LIST);
    const textareaStyle = expand ? "w-full h-72 input resize-none" : "w-full h-16 input resize-none";
    const toggleExpand = () => {
        setExpand(!expand);
    };
    const onPaste = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        console.log(url);
    }, []);
    useEffect(() => {
        if (textareaElement.current) {
            const callback = onPasteImage(onPaste);
            const element = textareaElement.current;
            element.addEventListener("paste", callback);
            return () => {
                element.removeEventListener("paste", callback);
            };
        }
    });
    return selectedChat.id ? <div class="w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div class="flex-auto">Chat Messages</div>
        <div class="flex-shrink-0 w-full border-t">
            <div class="w-full flex items-center">
                <div class="flex-auto px-4 pb-4">
                    <div class="w-full h-4 cursor-pointer flex justify-center items-center" onClick={toggleExpand}>{expand ? "🞃" : "🞁"}</div>
                    <textarea class={textareaStyle} ref={textareaElement} />
                </div>
                <button class="flex-shrink-0 btn btn-primary mr-4">发送</button>
            </div>
        </div>
    </div> : <div class="w-full h-full flex justify-center items-center">未选择会话</div>;
};
export default ChatFrame;
