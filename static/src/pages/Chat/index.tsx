import { h } from "preact";
import ChatFrame from "../../components/ChatFrame";
import ChatList from "../../components/ChatList";

const Chat: () => h.JSX.Element = () => {
    return <div class="flex w-full h-full overflow-hidden">
        <div class="flex-shrink-0 w-96 h-full border-r">
            <ChatList />
        </div>
        <div class="flex-auto h-full overflow-hidden">
            <ChatFrame />
        </div>
    </div>;
};

export default Chat;
