import { SubscribeContext } from "../../qqcore/context.js";
import { QQClient } from "../../qqcore/qqclient.js";

export const clientSubscripter: (src: undefined, args: Record<string, never>, ctx: SubscribeContext) => AsyncGenerator<QQClient, null, unknown> = async function *(src, args, ctx) {
    if (ctx.extra?.qclient) {
        const resId = ctx.extra.qclient.getGlobalId();
        const sub = ctx.extra.qclient.createSubscribe<QQClient>(resId, ctx.id);
        yield ctx.extra.qclient;
        while (ctx.extra?.qclient) {
            try {
                ctx.extra.qclient.touch();
                const client = await sub.waitNext();
                if (client) {
                    yield client;
                }
            } catch {
                return null; // subscribe end.
            }
        }
    }
    return null;
};
