import {
    Network,
    Observable,
    RequestParameters,
    Variables,
    Environment,
    RecordSource,
    Store,
} from "relay-runtime";
import { createClient } from "graphql-ws";

const url = (() => {
    if (process.env.NODE_ENV === "development") {
        return "ws://localhost:4000/graphql";
    } else {
        return `${window.location.protocol.startsWith("https") ? "wss" : "ws"}://${window.location.host}/graphql`;
    }
})();

const subscriptionsClient = createClient({
    url,
    connectionParams: () => {
        return {};
        // const session = getSession();
        // if (!session) {
        //   return {};
        // }
        // return {
        //   Authorization: `Bearer ${session.token}`,
        // };
    },
});

// both fetch and subscribe can be handled through one implementation
// to understand why we return Observable<any>, please see: https://github.com/enisdenjo/graphql-ws/issues/316#issuecomment-1047605774
function fetchOrSubscribe (operation: RequestParameters, variables: Variables): Observable<any> {
    return Observable.create((sink) => {
        if (!operation.text) {
            return sink.error(new Error("Operation text cannot be empty"));
        }
        return subscriptionsClient.subscribe(
            {
                operationName: operation.name,
                query: operation.text,
                variables,
            },
            sink,
        );
    });
}

export default new Environment({
    network: Network.create(fetchOrSubscribe, fetchOrSubscribe),
    store: new Store(new RecordSource()),
});
