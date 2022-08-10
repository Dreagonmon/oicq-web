import { h } from "preact";
import { client as clientStore, selectChat } from "../../stores";
import { useStore } from "@nanostores/preact";
import { QQClient } from "../../types/QQClient";
import { useMemo } from "preact/hooks";

const ChatList: () => h.JSX.Element = () => {
    const client = useStore(clientStore) as QQClient;
    const renderChatSessionList = (client: QQClient) => {
        if (!client.chatSessions) {
            return [];
        }
        return client.chatSessions.map((chatSession) => {
            const onClick = () => {
                if (chatSession.id) {
                    selectChat(chatSession.id);
                    console.debug("Chat", chatSession.id);
                }
            };
            return <div class="h-24 border-b flex cursor-pointer" onClick={onClick} key={chatSession.id}>
                <div class="w-24 h-full p-2">
                    <img class="rounded-full" src={chatSession.avatarUrl} />
                </div>
                <div class="flex-1 h-full flex content-center justify-center items-center">
                    {chatSession.title}
                </div>
                <div class="w-16 h-full flex content-center justify-center items-center">
                    { chatSession.unread && chatSession.unread > 0
                        ? <div class="bg-red-600 text-white rounded-full w-8 h-8 flex justify-center items-center">{chatSession.unread >= 100 ? "99+" : chatSession.unread}</div>
                        : null
                    }
                </div>
            </div>;
        });
    };
    const chatSessionRenderList = useMemo(() => {
        return renderChatSessionList(client);
    }, [client]);
    return <div class="w-full h-full overflow-x-hidden overflow-y-auto">
        { !client.chatSessions || client.chatSessions.length <= 0 ? <div class="w-full h-full flex justify-center items-center">
            <span>会话列表为空</span>
        </div> : chatSessionRenderList }
    </div>;
};
export default ChatList;
