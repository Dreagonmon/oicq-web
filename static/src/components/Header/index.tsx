import { h } from "preact";
import { useStore } from "@nanostores/preact";
import { client as clientStore, clientLogoutThis, clientLogoutAll } from "../../stores";

const Header = () => {
    const client = useStore(clientStore, { keys: ["isOnline"]});

    return <header className="bg-sky-500 text-white fixed left-0 top-0 w-full h-16 shadow-float flex flex-row items-center z-50 overflow-x-hidden overflow-y-hidden">
        <span className="grow-0 px-4 text-xl">QQ Lite</span>
        <span class="flex-auto" />
        { client.isOnline ?
            <button className="btn btn-warning mr-4" onClick={clientLogoutThis}>退出当前设备</button>
            : null }
        { client.isOnline ?
            <button className="btn btn-danger mr-4" onClick={clientLogoutAll}>注销</button>
            : null }
    </header>;
};

export default Header;
