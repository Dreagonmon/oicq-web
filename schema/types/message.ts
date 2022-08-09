import { GraphQLString, GraphQLObjectType, GraphQLInt, GraphQLBoolean } from "graphql";
import { SavedMessage } from "../../qqcore/message.js";

export const Message = new GraphQLObjectType({
    name: "Message",
    fields: {
        recordId: {
            type: GraphQLInt,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.record_id;
                }
                return -1;
            },
        },
        atMe: {
            type: GraphQLBoolean,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.atme;
                }
                return false;
            },
        },
        sender: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.user_id.toString();
                }
                return "";
            },
        },
        time: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.time.toString();
                }
                return "";
            },
        },
        seq: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.seq.toString();
                }
                return "";
            },
        },
        rand: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.rand.toString();
                }
                return "";
            },
        },
        nickname: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return src.nickname;
                }
                return "";
            },
        },
        message: {
            type: GraphQLString,
            resolve: (src) => {
                if (src instanceof SavedMessage) {
                    return JSON.stringify(src.message);
                }
                return JSON.stringify([]);
            },
        },
    },
});
