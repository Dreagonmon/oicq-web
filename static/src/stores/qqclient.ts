import { map, action, onMount, task } from "nanostores";
import { qid, userPass } from "./saved";
import { request, getClient } from "../utils/graphql";
import { QQClient } from "../types/QQClient";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const GQL_LOGIN = `#graphql
mutation Login($qid: String!, $qPass: String, $userPass: String!) {
    login(qid: $qid, qPass: $qPass, userPass: $userPass) {
        id
        qid
        isOnline
        loginImage
        loginError
    }
}
`;
const GQL_SUBSCRIPTION_CLIENT = `#graphql
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
const GQL_QUERY_CLIENT = `#graphql
query QueryClient {
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
const GQL_LOGOUT = `#graphql
mutation Logout {
    logout
  }
`;
interface GQLLoginResult {
    login?: QQClient;
}
interface GQLSubscriptionClientResult {
    client?: QQClient;
}
interface GQLQueryClientResult {
    client?: QQClient;
}
const EMPTY_PARAMS = {};

let subscriptionCancel: (() => void) | null = null;
let shouldReconnect = 0;
let subcriptionId = 1;
const unsbuscribeClient = () => {
    shouldReconnect = 0;
    if (subscriptionCancel) {
        subscriptionCancel();
    }
    subscriptionCancel = null;
};
const subscribeClient = () => {
    unsbuscribeClient();
    return new Promise<QQClient | null>((resolve, reject) => {
        const gqlClient = getClient();
        let isFirstTime = true;
        const thisSubsciptionId = subcriptionId++;
        subscriptionCancel = gqlClient.subscribe<GQLSubscriptionClientResult>({ query: GQL_SUBSCRIPTION_CLIENT, variables: EMPTY_PARAMS }, {
            next: (value) => {
                if (value.data && value.data.client) {
                    client.set(value.data.client);
                    shouldReconnect = thisSubsciptionId; // got data once, will auto reconnect.
                }
                if (isFirstTime) {
                    isFirstTime = false;
                    resolve(value.data && value.data.client ? value.data.client : null);
                }
            },
            error: (error) => {
                console.debug(error);
                if (isFirstTime) {
                    isFirstTime = false;
                    reject(error);
                }
            },
            complete: async () => {
                if (shouldReconnect === thisSubsciptionId) {
                    await sleep(30000);
                    if (shouldReconnect === thisSubsciptionId) subscribeClient();
                } else {
                    subscriptionCancel = null;
                }
            },
        });
    });
};

// store
export const client = map<QQClient>({});

// action
export const clientQuery = action(client, "queryClient", async (a_client) => {
    const res = await request<GQLQueryClientResult>(GQL_QUERY_CLIENT, EMPTY_PARAMS);
    if (res.data && res.data.client) {
        a_client.set(res.data.client);
        return res.data.client;
    }
    return null;
});
export const clientLogin = action(client, "login", async (a_client, a_qid: string, a_qpass: string, a_upass: string) => {
    const res = await request<GQLLoginResult>(GQL_LOGIN, { qid: a_qid, qPass: a_qpass, userPass: a_upass });
    if (res.data && res.data.login) {
        if (res.data.login.isOnline) {
            qid.set(Number.parseInt(a_qid, 10));
            userPass.set(a_upass);
            subscribeClient(); // will set client
        }
        return res.data.login;
    }
    return null;
});
export const clientLogoutThis = action(client, "logoutThis", async (a_client) => {
    unsbuscribeClient();
    a_client.set({});
    qid.set(0);
    userPass.set("");
});
export const clientLogoutAll = action(client, "logoutAll", async (a_client) => {
    unsbuscribeClient();
    await request(GQL_LOGOUT, EMPTY_PARAMS);
    a_client.set({});
    qid.set(0);
    userPass.set("");
});

// event
onMount(client, () => {
    if (qid.get() > 0) {
        task(async () => {
            await subscribeClient();
        });
    }
    return unsbuscribeClient;
});

