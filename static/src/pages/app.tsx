import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { client as clientStore } from "../stores";
import Header from "../components/Header";
import Login from "./Login";
import Chat from "./Chat";

const App = () => {
    const client = useStore(clientStore, { keys: ["isOnline"]});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // wait client init.
        if (client.isOnline) {
            setLoading(false);
            return;
        }
        const handler = setTimeout(() => {
            setLoading(false);
        }, 2000);
        return () => {
            clearTimeout(handler);
        };
    }, [client]); // only run once

    return <div id="app" className="w-full h-full">
        <Header />
        {loading ? null : <div className="pt-16 w-full h-full overflow-hidden flex flex-col bg-gray-100">
            {client.isOnline ? <Chat /> : <Login />}
            {/* <Test /> */}
        </div>}
    </div>;
};

export default App;
