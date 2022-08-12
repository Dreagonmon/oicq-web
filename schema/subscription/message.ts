import { GraphQLFieldConfigArgumentMap, GraphQLNonNull, GraphQLString } from "graphql";
import { SubscribeContext } from "../../qqcore/context.js";
import { SavedMessage } from "../../qqcore/message.js";

export interface MessageArgs {
    chatSessionId: string,
}

export const MessageInput: GraphQLFieldConfigArgumentMap = {
    chatSessionId: { type: new GraphQLNonNull(GraphQLString) },
};

export const messageSubscripter: (src: undefined, args: MessageArgs, ctx: SubscribeContext) => AsyncGenerator<SavedMessage, null, unknown> = async function *(src, args, ctx) {
    if (ctx.extra?.qclient) {
        const resId = args.chatSessionId;
        for (const msg of await ctx.extra.qclient.getMessage(resId)) {
            yield msg;
        }
        const sub = ctx.extra.qclient.createSubscribe<SavedMessage>(resId, ctx.id);
        while (ctx.extra?.qclient) {
            try {
                const message = await sub.waitNext();
                if (message) {
                    yield message;
                }
            } catch {
                return null;
            }
        }
    }
    return null;
};
