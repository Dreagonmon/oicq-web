import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { client as clientStore } from "../stores";
import Header from "../components/Header";
import Login from "./Login";
import Chat from "./Chat";
import { usePartStore } from "../hooks/partStore";
import { QQClient } from "../types/QQClient";

const CLIENT_ATTR_LIST = ["isOnline"] as (keyof QQClient)[];

const App = () => {
    const client = usePartStore<QQClient>(clientStore, CLIENT_ATTR_LIST);
    const [loading, setLoading] = useState(true);
    console.debug("app.tsx", client);

    useEffect(() => {
        // wait client init.
        if (client.isOnline) {
            setLoading(false);
            return;
        }
        const handler = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => {
            clearTimeout(handler);
        };
    }, [client]); // only run once

    return <div id="app" className="w-full h-full">
        <Header />
        {loading ? null : <div className="pt-16 w-full h-full overflow-hidden flex flex-col bg-white">
            {client.isOnline ? <Chat /> : <Login />}
            {/* <Test /> */}
        </div>}
    </div>;
};

export default App;
