import { GraphQLFieldResolver } from "graphql";
import { SubscribeContect } from "../../qqcore/context.js";
import { QQClient } from "../../qqcore/qqclient.js";
import { combineId } from "../types/node.js";
import { TYPECODE } from "../types/qqclient.js";

export const clientSubscripter: GraphQLFieldResolver<undefined, SubscribeContect, Record<string, never>, AsyncGenerator<QQClient, null, unknown>> = async function *(src, args, ctx) {
    if (ctx.extra?.qclient) {
        const resId = combineId(TYPECODE, ctx.extra.qclient.client.uin.toString());
        const sub = ctx.extra.qclient.createSubscribe<QQClient>(resId, ctx.id);
        while (ctx.extra?.qclient) {
            try {
                const client = await sub.waitNext();
                yield client;
                ctx.extra.qclient.touch();
            } catch {
                return null; // subscribe end.
            }
        }
    }
    return null;
};
