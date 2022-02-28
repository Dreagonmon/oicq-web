import { h } from "preact";
import { useStore } from "@nanostores/preact";
import { client as clientStore } from "../utils/store";
import Header from "./header";
import Login from "../pages/Login";
// import Test from "../pages/test";

const App = () => {
    const client = useStore(clientStore, { keys: ["isOnline"]});
    return <div id="app" className="w-full h-full">
        <Header />
        <div className="pt-16 w-full h-full overflow-hidden flex flex-col bg-gray-100">
            {client.isOnline ? "登录成功!" : <Login />}
            {/* <Test /> */}
        </div>
    </div>;
};

export default App;
