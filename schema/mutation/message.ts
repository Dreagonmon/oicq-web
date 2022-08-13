import { GraphQLFieldConfigArgumentMap, GraphQLFieldResolver, GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql";
import { FaceElem, ImageElem, MessageElem, Quotable, TextElem } from "oicq";
import { SubscribeContext } from "../../qqcore/context.js";

export interface QuotableArgs {
    sender: string,
    time: string,
    seq: string,
    rand: string,
    message: string,
}

export interface MessageSendArgs {
    chatSessionId: string,
    content: string,
    source?: QuotableArgs,
}

export interface MessageReadArgs {
    chatSessionId: string,
}

export const QuotableInput = new GraphQLInputObjectType({
    name: "Quotable",
    description: "回复消息引用, 只在发送Text类型的消息时起作用, 图片等类型的消息不能回复它人",
    fields: {
        sender: { type: new GraphQLNonNull(GraphQLString) },
        time: { type: new GraphQLNonNull(GraphQLString) },
        seq: { type: new GraphQLNonNull(GraphQLString) },
        rand: { type: new GraphQLNonNull(GraphQLString) },
        message: { type: new GraphQLNonNull(GraphQLString) },
    },
});

export const MessageSendInput: GraphQLFieldConfigArgumentMap = {
    chatSessionId: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    source: { type: QuotableInput },
};

export const MessageReadInput: GraphQLFieldConfigArgumentMap = {
    chatSessionId: { type: new GraphQLNonNull(GraphQLString) },
};

const parseQuotable = (from: QuotableArgs) => {
    const q: Quotable = {
        user_id: Number.parseInt(from.sender),
        time: Number.parseInt(from.time),
        seq: Number.parseInt(from.seq),
        rand: Number.parseInt(from.rand),
        message: [{ type: "text", text: from.message }],
    };
    return q;
};

export const messageSendTextResolver: GraphQLFieldResolver<undefined, SubscribeContext, MessageSendArgs, Promise<boolean>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        const elements = JSON.parse(args.content) as MessageElem[];
        const messageElements: (TextElem | FaceElem | ImageElem)[] = [];
        elements.forEach((item) => {
            if (item.type === "text" || item.type === "face" || item.type === "image") {
                messageElements.push(item);
            }
        });
        if (args.source) {
            return await ctx.extra.qclient.sendMessage(args.chatSessionId, messageElements, parseQuotable(args.source));
        } else {
            return await ctx.extra.qclient.sendMessage(args.chatSessionId, messageElements);
        }
    }
    return false;
};

export const messageSendImageResolver: GraphQLFieldResolver<undefined, SubscribeContext, MessageSendArgs, Promise<boolean>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        // const elements = JSON.parse(args.content) as MessageElem[];
        // const imgs: ImageElem[] = [];
        // elements.forEach((item) => {
        //     if (item.type === "image") {
        //         imgs.push(item);
        //     }
        // });
        const imgs: ImageElem[] = [{ type: "image", file: Buffer.from(args.content, "base64") }];
        return await ctx.extra.qclient.sendMessage(args.chatSessionId, imgs);
    }
    return false;
};

export const messageReadResolver: GraphQLFieldResolver<undefined, SubscribeContext, MessageReadArgs, Promise<boolean>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        await ctx.extra.qclient.markReadedRemote(args.chatSessionId);
        return true;
    }
    return false;
};
