import { h } from "preact";
import { useEffect } from "preact/hooks";
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
    const client = useSubscription<GQL_QUERY_RESULT>(GQL_QUERY, {});

    useEffect(() => {
    }, []);

    return <div></div>;
}

export default Chat;
