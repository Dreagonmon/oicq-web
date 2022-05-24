import { h } from "preact";
import { client as clientStore } from "../../stores";
import { useStore } from "@nanostores/preact";
import { QQClient } from "../../types/QQClient";
import { useMemo, useState } from "preact/hooks";

const Chat: () => h.JSX.Element = () => {
    const [selectedChatSessionId, setSelectedChatSessionId] = useState(null as string | null);
    const client = useStore(clientStore) as QQClient;
    const renderChatSessionList = (client: QQClient) => {
        if (!client.chatSessions) {
            return [];
        }
        return client.chatSessions.map((chatSession) => {
            const onClick = () => {
                if (chatSession.id) {
                    setSelectedChatSessionId(chatSession.id);
                    console.debug("Chat", chatSession.id);
                }
            };
            return <div class="h-24 border-b flex cursor-pointer" onClick={onClick} key={chatSession.id}>
                <img class="w-24 h-full" src={chatSession.avatarUrl} />
                <div class="flex-1 h-full flex content-center justify-center items-center">
                    {chatSession.title}
                </div>
                <div class="w-16 h-full flex content-center justify-center items-center">
                    <span class="bg-red-600 text-white rounded-2xl p-1">{chatSession.unread}</span>
                </div>
            </div>;
        });
    };
    const chatSessionRenderList = useMemo(() => {
        return renderChatSessionList(client);
    }, [client]);
    return <div class="flex h-full overflow-hidden">
        <div class="w-96 h-full border-r overflow-x-hidden overflow-y-auto">
            { chatSessionRenderList }
        </div>
    </div>;
};

export default Chat;
