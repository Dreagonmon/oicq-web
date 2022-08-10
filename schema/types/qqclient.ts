import { GraphQLID, GraphQLString, GraphQLObjectType, GraphQLBoolean, GraphQLList, GraphQLInt } from "graphql";
import { NodeType } from "./node.js";
import { QQClient as _QQClient } from "../../qqcore/qqclient.js";
import { SubscribeContext } from "../../qqcore/context.js";

export const ChatSession = new GraphQLObjectType({
    name: "ChatSession",
    interfaces: [NodeType],
    fields: {
        id: {
            type: GraphQLID,
            resolve: (src) => {
                if (typeof src === "string") {
                    return src;
                } else if (typeof src?.sessionId == "string") {
                    return src.sessionId;
                }
            },
        },
        unread: {
            type: GraphQLInt,
            resolve: (src, args, ctx: SubscribeContext) => {
                if (typeof src === "string" && ctx.extra.qclient) {
                    src = ctx.extra.qclient.getChatSession(src);
                }
                if (typeof src?.unread === "number") {
                    return src.unread;
                }
                return 0;
            },
        },
        title: {
            type: GraphQLString,
            resolve: (src, args, ctx: SubscribeContext) => {
                if (typeof src === "string" && ctx.extra.qclient) {
                    return ctx.extra.qclient.getChatSessionName(src);
                }
                if (typeof src?.title === "string") {
                    return src.title;
                }
                return "";
            },
        },
        avatarUrl: {
            type: GraphQLString,
            resolve: (src, args, ctx: SubscribeContext) => {
                if (typeof src === "string" && ctx.extra.qclient) {
                    return ctx.extra.qclient.getChatSessionAvatar(src);
                }
                if (typeof src?.avatarUrl === "string") {
                    return src.avatarUrl;
                }
                return "";
            },
        },
    },
});

export const QQClient = new GraphQLObjectType({
    name: "QQClient",
    interfaces: [NodeType],
    fields: {
        id: {
            type: GraphQLID,
            resolve: (src) => {
                if (src instanceof _QQClient) {
                    return src.getGlobalId();
                }
            },
        },
        qid: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof _QQClient) {
                    return src.client.uin.toString();
                }
            },
        },
        isOnline: {
            type: GraphQLBoolean,
            resolve: (src) => {
                if (src instanceof _QQClient) {
                    return src.client.isOnline();
                }
            },
        },
        loginImage: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof _QQClient && src.extra?.loginImage) {
                    return `data:image/png;base64,${src.extra.loginImage?.toString("base64")}`;
                }
            },
        },
        loginError: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof _QQClient) {
                    return src.extra?.loginError;
                }
            },
        },
        chatSessions: {
            type: new GraphQLList(ChatSession),
            resolve: (src) => {
                if (src instanceof _QQClient) {
                    return src.getChatSessions();
                } else {
                    return [];
                }
            },
        },
    },
});
