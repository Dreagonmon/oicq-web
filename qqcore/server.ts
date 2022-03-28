import { readFile } from "fs/promises";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { ServerOptions } from "graphql-ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { WebSocketServer } from "ws";
import { URL } from "url";
import { schema } from "../schema/schema.js";
import { getPathInSrc } from "../utils/env.js";
import { getMime } from "../utils/mime.js";
import { ContextExtra, SubscribeContect } from "./context.js";
import { getQQClient } from "./qqclient.js";

type ServerOptionsWithExtra = ServerOptions<Record<string, unknown>, ContextExtra>;

const server_options: ServerOptionsWithExtra = {
    schema,
    context: (ctx, msg) => {
        const subscribeContext: SubscribeContect = { extra: ctx.extra, id: msg.id };
        return subscribeContext;
    },
    onConnect: (ctx) => {
        ctx.extra.qid = (ctx.connectionParams?.qid as number) ?? 0;
        if (ctx.extra.qid > 0) {
            const client = getQQClient(ctx.extra.qid);
            if (client && ctx.connectionParams?.userPass && client.checkUserPass(ctx.connectionParams?.userPass as string)) {
                ctx.extra.qclient = client;
            }
        }
        return true;
    },
    onComplete: (ctx, msg) => {
        // clear subscribe if exist
        if (ctx.extra.qclient) {
            ctx.extra.qclient.closeSubscribe(msg.id);
        }
    },
};

const static_file_handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> = async (req, res) => {
    if (!req.url) {
        res.end();
        return;
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = url.pathname.split("/").filter((val) => val?.length && val.length > 0);
    if (parts.length <= 0) {
        parts.push("index.html");
    }
    if (parts?.[0] == "graphql") {
        return; // processed by graphql-ws handler
    }
    const path = getPathInSrc("static", "build", ...parts);
    try {
        const content = await readFile(path);
        res.setHeader("Content-Type", getMime(path));
        res.end(content);
    } catch {
        res.statusCode = 404;
        res.end("404 Not Found.");
    }
};

export const createHttpServer: (serveStaticFile: boolean) => Server = (serveStaticFile) => {
    const server = createServer();
    const wss = new WebSocketServer({ server, path: "/graphql" });
    useServer(server_options, wss);
    if (serveStaticFile) {
        server.on("request", static_file_handler);
    }
    return server;
};
