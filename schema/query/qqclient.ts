import { GraphQLFieldResolver } from "graphql";
import { ContextWithExtra } from "../../qqcore/context.js";
import { QQClient } from "../../qqcore/qqclient.js";

export const clientResolver: GraphQLFieldResolver<undefined, ContextWithExtra, Record<string, never>, Promise<QQClient | null>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        return ctx.extra.qclient;
    }
    return null;
};
