import { GraphQLFieldResolver } from "graphql";
import { SubscribeContect } from "../../qqcore/context.js";
import { QQClient } from "../../qqcore/qqclient.js";

export const clientResolver: GraphQLFieldResolver<undefined, SubscribeContect, Record<string, never>, Promise<QQClient | null>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        ctx.extra.qclient.touch();
        return ctx.extra.qclient;
    }
    return null;
};
