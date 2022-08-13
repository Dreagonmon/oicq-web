import { h } from "preact";
import {
    selectedChatMessages as selectedChatMessagesStore,
    client as clientStore, senderAvatars,
    selectedChat as selectedChatStore,
    fetchMessageBefore,
    updateSenderAvatar,
    markRead,
} from "../../stores";
import { useStore } from "@nanostores/preact";
import { usePartStore, useKeyStore } from "../../hooks/partStore";
import { QQClient } from "../../types/QQClient";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { SelectedChatType } from "../../stores/message";
import { MessageElement } from "../../types/Message";
import faceIds from "../../assets/faceid";

interface MessageItemsOptions {
    messageContent: string,
}

const MessageItems: (params: MessageItemsOptions) => h.JSX.Element = ({ messageContent }) => {
    const messageElements: MessageElement[] = JSON.parse(messageContent);
    const render = () => {
        const children: h.JSX.Element[] = [];
        for (const item of messageElements) {
            const type = item.type;
            if (type === "text") {
                children.push(<span class="whitespace-pre-wrap">{item.text}</span>);
            } else if (type === "image") {
                // 受限于QQ禁止图片外链，只能在新窗口打开查看
                children.push(<div class="w-64 h-32 overflow-hidden">
                    <a class="block absolute w-64 h-32 cursor-pointer" href={item.url} rel="noreferrer" target="_blank" />
                    <iframe class="focus:border-none w-64 h-32" sandbox="" src={item.url} referrerpolicy="no-referrer" />
                </div>);
            } else if (type === "face") {
                if (item.id && item.id in faceIds) {
                    let idStr = item.id.toString(10);
                    while (idStr.length < 3) {
                        idStr = `0${idStr}`;
                    }
                    children.push(<span><img class="w-6 h-6" src={`assets/face/${idStr}`} /></span>);
                } else {
                    children.push(<span>[表情 {item.text}]</span>);
                }
            } else if (type === "at") {
                children.push(<span class="bg-sky-200 p-1">{item.text ? item.text : item.qq ? item.qq : item.id}</span>);
            } else {
                children.push(<span>[{item.type}]</span>);
            }
        }
        return children;
    };
    return <div class="flex flex-wrap max-w-full rounded-b-lg rounded-tr-lg shadow-float bg-gray-50 p-4">
        {render()}
    </div>;
};

interface LoadingButtonOptions {
    onAction: () => Promise<void>,
}

const LoadingButton: (params: LoadingButtonOptions) => h.JSX.Element = ({ onAction }) => {
    const [loading, setLoading] = useState(false);
    const onClick = async () => {
        setLoading(true);
        try {
            await onAction();
        } finally {
            setLoading(false);
        }
    };
    return <button class="p-4 cursor-pointer btn" onClick={onClick}>{loading ? "加载中……" : "加载更多"}</button>;
};

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

const SELECTED_CHAT_ATTR_LIST = ["id", "unread"] as (keyof SelectedChatType)[];
const CLIENT_ATTR_LIST = ["qid"] as (keyof QQClient)[];

const MessageList: () => h.JSX.Element = () => {
    const messages = useStore(selectedChatMessagesStore);
    const client = usePartStore(clientStore, CLIENT_ATTR_LIST);
    const selectedChat = usePartStore<SelectedChatType>(selectedChatStore, SELECTED_CHAT_ATTR_LIST);
    const scrollParent = useRef(null as HTMLDivElement | null);
    const autoScroll = useRef(true);
    const lastMessagesLength = useRef(messages.length);

    const scrollToBottom = useCallback(() => {
        if (autoScroll.current && scrollParent.current) {
            const elem = scrollParent.current;
            if (elem) {
                elem.scrollTop = elem.scrollHeight;
                markRead();
            }
        }
    }, []);

    const onScroll = useCallback((event: Event) => {
        const elem = event.target as HTMLDivElement | null;
        if (elem) {
            const scrollBottom = elem.scrollTop + elem.clientHeight;
            if (elem.scrollHeight - scrollBottom < 8) {
                autoScroll.current = true;
            } else {
                autoScroll.current = false;
            }
        }
    }, []);

    useEffect(() => {
        autoScroll.current = true;
        scrollToBottom();
    }, [scrollToBottom, selectedChat.id]);

    useEffect(() => {
        if (lastMessagesLength.current != messages.length) {
            lastMessagesLength.current = messages.length;
            scrollToBottom();
        }
    });

    useEffect(() => {
        if (scrollParent.current) {
            const elem = scrollParent.current;
            elem.addEventListener("scroll", onScroll);
            return () => {
                elem.removeEventListener("scroll", onScroll);
            };
        }
    });

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
                <LoadingButton onAction={() => fetchMessageBefore(rid, count)} />
            </div>);
        }
        if (msg.sender === client.qid) {
            renderList.push(<div class="w-full mb-4 flex justify-end items-start" key={rid}>
                <div class="mr-4 max-w-screen-sm whitespace-pre-wrap break-all">
                    <div class="w-full text-right">{msg.nickname}</div>
                    <div class="w-full mt-2">
                        <MessageItems messageContent={msg.message} />
                    </div>
                </div>
                <div class="w-16 h-16 flex justify-center items-center">
                    <Avatar sender={msg.sender} />
                </div>
            </div>);
        } else {
            renderList.push(<div class="w-full mb-4 flex justify-start items-start" key={rid}>
                <div class="w-16 h-16 flex justify-center items-center">
                    <Avatar sender={msg.sender} />
                </div>
                <div class="ml-4 max-w-screen-sm whitespace-pre-wrap break-all">
                    <div class="w-full">{msg.nickname}</div>
                    <div class="w-full mt-2">
                        <MessageItems messageContent={msg.message} />
                    </div>
                </div>
            </div>);
        }
        lastRecordId = rid;
    }
    return <div class="w-full h-full overflow-x-hidden overflow-y-auto px-4 pt-4" ref={scrollParent} >
        { renderList }
    </div>;
};
export default MessageList;
