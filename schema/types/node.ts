import { GraphQLInterfaceType, GraphQLID } from "graphql";

export const divideId: (id: string) => [string, string] = (id) => {
    return [id.substring(0, 4), id.substring(4)];
};

export const combineId: (typeCode: string, localId: string) => string = (typeCode, localId) => {
    return typeCode + localId;
};

export const NodeType = new GraphQLInterfaceType({
    name: "Node",
    fields: {
        id: {
            // 4chars type, remain is unique id whthin the same type. e.g. qqcl531486058
            type: GraphQLID,
            description: "Global node ID.",
        },
    },
});
