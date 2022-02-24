import { GraphQLObjectType } from "graphql";
import { NodeType } from "./node.js";

export const QQClient = new GraphQLObjectType({
    name: "QQClient",
    interfaces: [NodeType],
    fields: {
        //
    },
});
