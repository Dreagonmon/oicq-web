import { map, action, onMount } from "nanostores";
import { qid, userPass } from "./saved";
import { request, getClient } from "../utils/graphql";
import { QQClient } from "../types/QQClient";

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
const GQL_SUBSCRIPTION = `#graphql
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
const GQL_LOGOUT = `#graphql
mutation Logout {
    logout
  }
`;
interface GQL_LOGIN_RESULT {
    login?: QQClient;
}
interface GQL_SUBSCRIPTION_RESULT {
    client?: QQClient;
}
const EMPTY_PARAMS = {};

let subscriptionCancel: (() => void) | null = null;
const unsbuscribeClient = () => {
    if (subscriptionCancel) {
        subscriptionCancel();
    }
    subscriptionCancel = null;
};
const subscribeClient = () => {
    unsbuscribeClient();
    const gqlClient = getClient();
    const doSubscribe = () => {
        return gqlClient.subscribe<GQL_SUBSCRIPTION_RESULT>({ query: GQL_SUBSCRIPTION, variables: EMPTY_PARAMS }, {
            next: (value) => {
                if (value.data && value.data.client) {
                    client.set(value.data.client);
                }
            },
            error: (error) => {
                console.debug(error);
            },
            complete: () => {
                subscriptionCancel = null;
            },
        });
    };
    subscriptionCancel = doSubscribe();
};

// store
export const client = map<QQClient>({});

// action
export const clientLogin = action(client, "login", async (a_client, a_qid, a_qpass, a_upass) => {
    const res = await request<GQL_LOGIN_RESULT>(GQL_LOGIN, { qid: a_qid, qPass: a_qpass, userPass: a_upass });
    if (res.data && res.data.login) {
        if (res.data.login.isOnline) {
            qid.set(Number.parseInt(a_qid, 10));
            userPass.set(a_upass);
            subscribeClient(); // will set client
        } else {
            a_client.set(res.data.login);
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
    subscribeClient();
    return unsbuscribeClient;
});

