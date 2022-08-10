//https://github.com/enisdenjo/graphql-ws
import { GraphQLSchema, GraphQLObjectType, GraphQLBoolean, GraphQLList, GraphQLString } from "graphql";
import { QQClient } from "./types/qqclient.js";
import { Message } from "./types/message.js";
import {
    loginResolver as mQQClientLoginResolver,
    logoutResolver as mQQClientLogoutResolver,
    LoginInput as MQQClientLoginInput,
} from "./mutation/qqclient.js";
import {
    messageSendTextResolver as mMessageSendTextResolver,
    messageSendImageResolver as mMessageSendImageResolver,
    messageReadResolver as mMessageReadResolver,
    MessageSendInput as MMessageSendInput,
    MessageReadInput as MMessageReadInput,
} from "./mutation/message.js";
import { clientResolver as qQQClientClientResolver } from "./query/qqclient.js";
import {
    messageResolver as qMessageResolver,
    messageAvatarResolver as qMessageAvatarResolver,
    MessageInput as QMessageInput,
    MessageSenderInput as QMessageSenderArgs,
} from "./query/message.js";
import { clientSubscripter as sQQClientSubscripter } from "./subscription/qqclient.js";
import {
    messageSubscripter as sMessageSubscripter,
    MessageArgs as SMessageArgs,
    MessageInput as SMessageInput,
} from "./subscription/message.js";
import { SubscribeContext } from "../qqcore/context.js";

export const schema = new GraphQLSchema({
    mutation: new GraphQLObjectType({
        name: "Mutation",
        fields: {
            login: {
                type: QQClient,
                args: MQQClientLoginInput,
                resolve: mQQClientLoginResolver,
            },
            logout: {
                type: GraphQLBoolean,
                resolve: mQQClientLogoutResolver,
            },
            sendTextMessage: {
                type: GraphQLBoolean,
                args: MMessageSendInput,
                resolve: mMessageSendTextResolver,
            },
            sendImageMessage: {
                type: GraphQLBoolean,
                args: MMessageSendInput,
                resolve: mMessageSendImageResolver,
            },
            markRead: {
                type: GraphQLBoolean,
                args: MMessageReadInput,
                resolve: mMessageReadResolver,
            },
        },
    }),
    query: new GraphQLObjectType({
        name: "Query",
        fields: {
            client: {
                type: QQClient,
                resolve: qQQClientClientResolver,
            },
            message: {
                type: new GraphQLList(Message),
                args: QMessageInput,
                resolve: qMessageResolver,
            },
            messageAvatar: {
                type: GraphQLString,
                args: QMessageSenderArgs,
                resolve: qMessageAvatarResolver,
            },
        },
    }),
    subscription: new GraphQLObjectType({
        name: "Subscription",
        fields: {
            message: {
                type: Message,
                args: SMessageInput,
                subscribe: async function *(src, args: SMessageArgs, ctx: SubscribeContext) {
                    const gen = sMessageSubscripter(src, args, ctx);
                    while (true) {
                        const { value, done } = await gen.next();
                        if (done) {
                            break;
                        }
                        yield { message: value };
                    }
                },
            },
            client: {
                type: QQClient,
                subscribe: async function *(src, args: Record<string, never>, ctx: SubscribeContext) {
                    const gen = sQQClientSubscripter(src, args, ctx);
                    while (true) {
                        const { value, done } = await gen.next();
                        if (done) {
                            break;
                        }
                        yield { client: value };
                    }
                },
            },
        },
    }),
});
