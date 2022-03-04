//https://github.com/enisdenjo/graphql-ws
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLBoolean } from "graphql";
import { QQClient } from "./types/qqclient.js";
import {
    loginResolver as mQQClientLoginResolver,
    logoutResolver as mQQClientLogoutResolver,
    LoginInput as MQQClientLoginInput,
} from "./mutation/qqclient.js";
import { clientResolver as qQQClientClientResolver } from "./query/qqclient.js";
import { clientSubscripter as sQQClientSubscripter } from "./subscription/qqclient.js";
import { setTimeout } from "timers/promises";

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
            hello: {
                type: GraphQLString,
                resolve: () => {
                    return "world";
                },
            },
            client: {
                type: QQClient,
                resolve: qQQClientClientResolver,
            },
        },
    }),
    subscription: new GraphQLObjectType({
        name: "Subscription",
        fields: {
            greetings: {
                type: GraphQLString,
                subscribe: async function *() {
                    for (let i = 0; i < 3600; i++) {
                        for (const hi of ["Hi", "Bonjour", "Hola", "Ciao", "Zdravo"]) {
                            yield { greetings: hi };
                            await setTimeout(1000);
                        }
                    }
                },
            },
            client: {
                type: QQClient,
                subscribe: sQQClientSubscripter,
            },
        },
    }),
});
