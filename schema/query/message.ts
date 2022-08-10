import { GraphQLFieldConfigArgumentMap, GraphQLFieldResolver, GraphQLString, GraphQLInt, GraphQLNonNull } from "graphql";
import { SubscribeContext } from "../../qqcore/context.js";
import { SavedMessage } from "../../qqcore/message.js";

export interface MessageArgs {
    chatSessionId: string,
    fromRecordId: number,
    count: number,
}

export const MessageInput: GraphQLFieldConfigArgumentMap = {
    chatSessionId: { type: new GraphQLNonNull(GraphQLString) },
    fromRecordId: { type: new GraphQLNonNull(GraphQLInt) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
};

export interface MessageSenderArgs {
    sender: string,
}

export const MessageSenderInput: GraphQLFieldConfigArgumentMap = {
    sender: { type: new GraphQLNonNull(GraphQLString) },
};

export const messageResolver: GraphQLFieldResolver<undefined, SubscribeContext, MessageArgs, Promise<Array<SavedMessage>>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        return await ctx.extra.qclient.getMessage(args.chatSessionId, args.fromRecordId, args.count);
    }
    return [];
};

export const messageAvatarResolver: GraphQLFieldResolver<undefined, SubscribeContext, MessageSenderArgs, Promise<string>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        return ctx.extra.qclient.getUserAvatar(Number.parseInt(args.sender));
    }
    return "";
};
