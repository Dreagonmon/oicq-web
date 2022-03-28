//https://github.com/enisdenjo/graphql-ws
import { GraphQLSchema, GraphQLObjectType, GraphQLBoolean } from "graphql";
import { QQClient } from "./types/qqclient.js";
import {
    loginResolver as mQQClientLoginResolver,
    logoutResolver as mQQClientLogoutResolver,
    LoginInput as MQQClientLoginInput,
} from "./mutation/qqclient.js";
import { clientResolver as qQQClientClientResolver } from "./query/qqclient.js";
import { clientSubscripter as sQQClientSubscripter } from "./subscription/qqclient.js";
import { SubscribeContect } from "../qqcore/context.js";

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
        },
    }),
    query: new GraphQLObjectType({
        name: "Query",
        fields: {
            client: {
                type: QQClient,
                resolve: qQQClientClientResolver,
            },
        },
    }),
    subscription: new GraphQLObjectType({
        name: "Subscription",
        fields: {
            client: {
                type: QQClient,
                subscribe: async function *(src, args: Record<string, never>, ctx: SubscribeContect) {
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
