import { h } from "preact";
import { client as clientStore, selectedChat as selectedChatStore, clientLogoutThis, clientLogoutAll } from "../../stores";
import { usePartStore } from "../../hooks/partStore";
import { QQClient } from "../../types/QQClient";
import { SelectedChatType } from "../../stores/message";

const CLIENT_ATTR_LIST = ["isOnline"] as (keyof QQClient)[];
const SELECTED_CHAT_ATTR_LIST = ["id", "title", "avatarUrl", "unread"] as (keyof SelectedChatType)[];

const Header = () => {
    const client = usePartStore<QQClient>(clientStore, CLIENT_ATTR_LIST);
    const selectedChat = usePartStore<SelectedChatType>(selectedChatStore, SELECTED_CHAT_ATTR_LIST);

    const openAvatarImage = () => {
        if (selectedChat.avatarUrl) {
            window.open(selectedChat.avatarUrl, "_blank", "centerscreen,menubar=no,toolbar=no,location=no,personalbar=no,status=no,dialog=yes");
        }
    };

    return <header className="bg-sky-500 text-white fixed left-0 top-0 w-full h-16 shadow-float flex flex-row items-center z-50 overflow-x-hidden overflow-y-hidden">
        <span className="grow-0 w-96 flex items-center">
            <span class="text-xl px-8">OICQ Web</span>
            <span class="flex-auto" />
            { client.isOnline ?
                <button className="btn btn-warning mr-4" onClick={clientLogoutThis}>退出当前设备</button>
                : null }
            { client.isOnline ?
                <button className="btn btn-danger mr-4" onClick={clientLogoutAll}>注销</button>
                : null }
        </span>
        <span class="flex-auto h-16 inline-flex">
            <div class="w-16 h-full p-2 cursor-pointer" onClick={openAvatarImage}>
                <img class="rounded-full" src={selectedChat.avatarUrl} />
            </div>
            <div class="flex-1 h-full flex content-center justify-center items-center text-xl">
                {selectedChat.title}
            </div>
            <div class="w-16 h-full flex content-center justify-center items-center">
                { selectedChat.unread && selectedChat.unread > 0
                    ? <div class="bg-red-600 text-white rounded-full w-8 h-8 flex justify-center items-center">{selectedChat.unread >= 100 ? "99+" : selectedChat.unread}</div>
                    : null
                }
            </div>
        </span>
    </header>;
};

export default Header;
