import { createClient, Client, ExecutionResult } from "graphql-ws";
import { qid, userPass } from "../stores";

const RESPONSE_TIMEOUT = 1000;
const ACK_INTERVAL = 60000;
const IDEL_TIMEOUT = 60000;
const RETRY = 3;

let client: undefined | Client;
const url = (() => {
    if (process.env.NODE_ENV === "development") {
        return "ws://localhost:4000/graphql";
    }
    return `${window.location.protocol.startsWith("https") ? "wss" : "ws"}://${window.location.host}/graphql`;
})();

const makeClient = () => {
    let activeSocket: WebSocket | undefined;
    let timedOut = 0;
    return createClient({
        url,
        lazy: true,
        keepAlive: ACK_INTERVAL, // ack time
        connectionAckWaitTimeout: RESPONSE_TIMEOUT,
        lazyCloseTimeout: IDEL_TIMEOUT, // keep connection
        retryAttempts: RETRY,
        connectionParams: () => {
            return {
                qid: qid.get(),
                userPass: userPass.get(),
            };
        },
        on: {
            connected: (socket) => {
                activeSocket = socket as WebSocket;
            },
            ping: (received) => {
                if (!received) { // sent
                    const waitPingCallback: TimerHandler = () => {
                        if ((activeSocket as WebSocket).readyState === WebSocket.OPEN) (activeSocket as WebSocket).close(4408, "Request Timeout");
                    };
                    timedOut = setTimeout(waitPingCallback, RESPONSE_TIMEOUT); // wait 1 seconds for the pong and then close the connection
                }
            },
            pong: (received) => {
                if (received) clearTimeout(timedOut); // pong is received, clear connection close timeout
            },
            closed: () => {
                activeSocket = undefined;
            },
        },
    });
};

export const getClient = () => {
    if (!client) {
        // init
        client = makeClient();
    }
    return client;
};

export const request = <T>(gql: string, varbs: Record<string, unknown> = {}) => {
    const client = getClient();
    return new Promise<ExecutionResult<T>>((resolve, reject) => {
        let data: ExecutionResult<T>;
        client.subscribe<T>({ query: gql, variables: varbs }, {
            next: (val: ExecutionResult<T>) => { data = val; },
            complete: () => { resolve(data); },
            error: (err) => { return reject(err); },
        });
    });
};
