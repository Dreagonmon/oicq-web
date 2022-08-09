import { GraphQLFieldResolver, GraphQLFieldConfigArgumentMap, GraphQLString, GraphQLNonNull } from "graphql";
import { Platform } from "oicq";
import { setTimeout } from "timers/promises";
import { SubscribeContext } from "../../qqcore/context.js";
import { getQQClient, createQQClient, removeQQClient, QQClient } from "../../qqcore/qqclient.js";

interface LoginArgs {
    qid: string,
    qPass?: string,
    userPass: string,
}

export const LoginInput: GraphQLFieldConfigArgumentMap = {
    qid: { type: new GraphQLNonNull(GraphQLString) },
    qPass: { type: GraphQLString },
    userPass: { type: new GraphQLNonNull(GraphQLString) },
};

export const loginResolver: GraphQLFieldResolver<undefined, SubscribeContext, LoginArgs, Promise<QQClient | null | undefined>> = async (src, args, ctx) => {
    try {
        const qid = args?.qid ? Number.parseInt(args.qid) : NaN;
        if (!(args?.userPass) || Number.isNaN(qid)) {
            return null; // require userPass and qid.
        }
        let client = getQQClient(qid);
        if (client === null) {
            client = createQQClient(qid, args.userPass, Platform.iMac);
            await client.init();
        }
        client.touch();
        if (client.client.isOnline()) {
            // 客户端已在线，验证userPass
            if (client.checkUserPass(args.userPass)) {
                ctx.extra.qclient = client;
                return client;
            } else {
                return null;
            }
        } else {
            // 尝试登录
            if (args?.qPass && args.qPass.length > 6) {
                await client.client.login(args.userPass);
            } else {
                await client.client.login();
            }
            await setTimeout(1000); // 等待登录状态更新
            if (client.client.isOnline()) {
                // 登录成功
                ctx.extra.qclient = client;
                client.extra.loginImage = undefined;
                client.extra.loginError = undefined;
            } else {
                // 需要扫码登录？
                if (client.extra.loginError) {
                    // 登录错误，删除该客户端对象，下次重新登录
                    removeQQClient(qid);
                }
            }
            return client;
        }
    } catch (e) {
        console.error(e);
    }
};

export const logoutResolver: GraphQLFieldResolver<undefined, SubscribeContext, LoginArgs, Promise<boolean>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        // only logout when authed.
        const qid = ctx.extra.qclient.client.uin;
        // logout
        try {
            await ctx.extra.qclient.close();
        } catch (e) { console.error(e); }
        // update subscribe
        const resId = ctx.extra.qclient.getGlobalId();
        ctx.extra.qclient.feedSubscribe(resId, ctx.extra.qclient);
        ctx.extra.qclient.closeSubscribe(resId);
        ctx.extra.qclient = undefined;
        removeQQClient(qid);
        return true;
    }
    return false;
};
