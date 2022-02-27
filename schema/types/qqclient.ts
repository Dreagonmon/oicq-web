import { GraphQLID, GraphQLString, GraphQLObjectType, GraphQLBoolean } from "graphql";
import { combineId, NodeType } from "./node.js";
import { QQClient as _QQClient } from "../../qqcore/qqclient.js";

const TYPECODE = "QQLC";

export const QQClient = new GraphQLObjectType({
    name: "QQClient",
    interfaces: [NodeType],
    fields: {
        id: {
            type: GraphQLID,
            resolve: (src) => {
                if (src instanceof _QQClient) {
                    return combineId(TYPECODE, src.client.uin.toString());
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
    },
});
