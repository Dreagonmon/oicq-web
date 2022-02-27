import { GraphQLFieldResolver, GraphQLFieldConfigArgumentMap, GraphQLString } from "graphql";
import { Platform } from "oicq";
import { setTimeout } from "timers/promises";
import { ContextWithExtra } from "../../qqcore/context.js";
import { getQQClient, createQQClient, removeQQClient, QQClient } from "../../qqcore/qqclient.js";

interface LoginArgs {
    qid?: string,
    qPass?: string,
    userPass?: string,
}

export const LoginInput: GraphQLFieldConfigArgumentMap = {
    qid: { type: GraphQLString },
    qPass: { type: GraphQLString },
    userPass: { type: GraphQLString },
};

export const loginResolver: GraphQLFieldResolver<undefined, ContextWithExtra, LoginArgs, Promise<QQClient>> = async (src, args, ctx) => {
    try {
        const qid = Number.parseInt(args?.qid);
        if (!(args?.userPass) || Number.isNaN(qid)) {
            return null; // require userPadd and qid.
        }
        if (ctx.extra?.qclient) {
            return ctx.extra.qclient; // already logined.
        }
        let client = getQQClient(qid);
        if (client === null) {
            client = createQQClient(qid, args.userPass, Platform.iMac);
            await client.init();
        }
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
            }
            return client;
        }
    } catch (e) {
        console.error(e);
    }
};

export const logoutResolver: GraphQLFieldResolver<undefined, ContextWithExtra, LoginArgs, Promise<boolean>> = async (src, args, ctx) => {
    if (ctx.extra?.qclient) {
        // only logout when authed.
        const qid = ctx.extra.qclient?.client?.uin;
        try {
            await ctx.extra.qclient.close();
        } catch (e) { console.error(e); }
        ctx.extra.qclient = undefined;
        removeQQClient(qid);
        return true;
    }
    return false;
};
