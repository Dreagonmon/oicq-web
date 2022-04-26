import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { client as clientStore } from "../utils/store";
import { QQClient } from "../types/QQClient";
import { request } from "../utils/graphql";
import Header from "../components/header";
import Login from "./Login";
import Chat from "./Chat";
// import Test from "../pages/test";

interface GQL_QUERY_RESULT {
    client?: QQClient;
}

const GQL_QUERY = `#graphql
query QueryClient {
    client {
        qid
        isOnline
    }
}
`;

const App = () => {
    const client = useStore(clientStore, { keys: ["isOnline"]});

    useEffect(() => {
        request<GQL_QUERY_RESULT>(GQL_QUERY, {}).then((res) => {
            if (res.data && res.data.client && res.data.client.isOnline) {
                clientStore.set(res.data.client);
            }
        }).catch(() => { /* just ignore the error */});
    }, []); // only run once

    return <div id="app" className="w-full h-full">
        <Header />
        <div className="pt-16 w-full h-full overflow-hidden flex flex-col bg-gray-100">
            {client.isOnline ? <Chat /> : <Login />}
            {/* <Test /> */}
        </div>
    </div>;
};

export default App;
