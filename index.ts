import { schema } from "./schema";
import { makeBehavior } from "graphql-ws/lib/use/uWebSockets";
import * as uWS from "uWebSockets.js";

uWS
    .App()
    .ws("/graphql", makeBehavior({ schema }))
    .listen(4000, (listenSocket) => {
        if (listenSocket) {
            console.log("Listening to port 4000");
        }
    });
