import { h } from "preact";
import {
    selectedChatMessages as selectedChatMessagesStore,
    client as clientStore, senderAvatars,
    fetchMessageBefore,
    updateSenderAvatar,
} from "../../stores";
import { useStore } from "@nanostores/preact";
import { usePartStore, useKeyStore } from "../../hooks/partStore";
import { QQClient } from "../../types/QQClient";

const CLIENT_ATTR_LIST = ["qid"] as (keyof QQClient)[];

interface AvatarOptions {
    sender: string,
}

const Avatar: (params: AvatarOptions) => h.JSX.Element = ({ sender }) => {
    const avatars = useKeyStore<Record<string, string>>(senderAvatars, sender);
    if (sender in avatars) {
        const src = avatars[sender];
        return <img class="w-full h-full rounded-full bg-transparent" src={src} loading="lazy" />;
    }
    updateSenderAvatar(sender);
    return <span class="w-full h-full rounded-full bg-gray-200" />;
};

const MessageList: () => h.JSX.Element = () => {
    const messages = useStore(selectedChatMessagesStore);
    const client = usePartStore(clientStore, CLIENT_ATTR_LIST);

    if (messages.length <= 0) {
        return <div class="w-full h-full flex justify-center items-center">暂无消息记录</div>;
    }
    let lastRecordId = -1;
    const renderList: h.JSX.Element[] = [];
    for (const msg of messages) {
        const rid = msg.recordId;
        if (rid - 1 > lastRecordId) {
            // 聊天记录不连续，插入加载按钮
            const count = rid - lastRecordId - 1;
            renderList.push(<div class="w-full flex justify-center items-center" key={rid - 1}>
                <span class="p-4 cursor-pointer" onClick={() => fetchMessageBefore(rid, count)}>加载更多</span>
            </div>);
        }
        if (msg.sender === client.qid) {
            renderList.push(<div class="w-full mb-4 flex justify-end items-start" key={rid}>
                {msg.message}
            </div>);
        } else {
            renderList.push(<div class="w-full mb-4 flex justify-start items-start" key={rid}>
                <div class="w-16 h-16 flex justify-center items-center">
                    <Avatar sender={msg.sender} />
                </div>
                <div class="ml-4 max-w-screen-sm whitespace-pre-wrap break-all">
                    {msg.message}
                </div>
            </div>);
        }
        lastRecordId = rid;
    }
    return <div class="w-full h-full overflow-x-hidden overflow-y-auto px-4 pt-4">
        { renderList }
    </div>;
};
export default MessageList;
