import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { QQClient } from "../../types/QQClient";
import { useSubscription } from "../../hooks/subscription";

interface GQL_QUERY_RESULT {
    client?: QQClient;
}

const GQL_QUERY = `#graphql
subscription SubscriptionClient {
    client {
        id
        qid
        isOnline
        chatSessions {
            id
            unread
            title
            avatarUrl
        }
    }
}
`;

const Chat: () => h.JSX.Element = () => {
    const [params, setParams] = useState({});
    const client = useSubscription<GQL_QUERY_RESULT>(GQL_QUERY, params);
    console.log(client);
    useEffect(() => {
    }, []);

    return <div></div>;
}

export default Chat;
