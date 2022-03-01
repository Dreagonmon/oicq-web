import { h } from "preact";
import { useStore } from "@nanostores/preact";
import { client as clientStore, qid as qidStore, userPass as userPassStore } from "../../utils/store";
import { request } from "../../utils/graphql";

const GQL_LOGOUT = `
mutation Logout {
    logout
  }
`;

const logout_local = () => {
    qidStore.set(0);
    userPassStore.set("");
    clientStore.set({});
};

const logout_remote = async () => {
    logout_local();
    await request(GQL_LOGOUT, {}); // 不管结果如何
}

const Header = () => {
    const client = useStore(clientStore, { keys: [ "isOnline" ] });

    return <header className="bg-sky-500 text-white fixed left-0 top-0 w-full h-16 shadow-float flex flex-row items-center z-50 overflow-x-hidden overflow-y-hidden">
        <span className="grow-0 px-4 text-xl">QQ Lite</span>
        <span class="flex-auto"></span>
        { client.isOnline ?
            <button className="btn btn-warning mr-4" onClick={logout_local}>退出当前设备</button>
        : null }
        { client.isOnline ?
            <button className="btn btn-danger mr-4" onClick={logout_remote}>注销</button>
        : null }
    </header>;
};

export default Header;
