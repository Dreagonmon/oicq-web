import { PromiseLock } from "../utils/lock.js";
import { AppendOnlyDatabase } from "../utils/aodb.js";
import { getPathInData, getPathWithin, ensureDirPromise, clearDirPromise } from "../utils/env.js";
import { registerBeforeExit } from "../utils/atexit.js";
import { hashPassword, createKey, encrypt, decrypt } from "../utils/passwd.js";
import { Subscribtion } from "./subscribe.js";
import { SavedMessage } from "./message.js";
import { combineId } from "../schema/types/node.js";
import { setTimeout } from "timers/promises";
import { createClient, Client, Platform, Message, Quotable, MessageElem, PrivateMessage } from "oicq";
import { Low, JSONFile } from "lowdb";
import log4js from "log4js";
const logger = log4js.getLogger("qqclient");

export const TYPECODE = "QQLC";

const CLIENT_IDLE_BEFORE_LOGOUT = 259200; // s, 60*60*24*3 = 3d
const CLIENT_IDLE_BEFORE_CLEAN = 3600; // s
const CLIENT_IDLE_CHECK_INTERVAL = 60; // s
const USER_PASS_RETRY_INTERVAL = 300; // s
const USER_PASS_RETRY_LIMIT = 5; // times
/* Global QQClient Storage */
const clientMap: Map<number, QQClient> = new Map();
/* last clean time */
let lastCleanTime = 0;
export interface ChatSession {
    sessionId: string;
    unread: number;
    title?: string;
    avatarUrl?: string;
}
export interface QQClientExtra {
    loginImage?: Buffer;
    loginError?: string;
    subscribtions: Array<Subscribtion<unknown>>;
    chatMessageDatabase: Map<string, AppendOnlyDatabase<Buffer>>;
}
interface QQClientStorage {
    userPassHash?: string;
    chatSessions: Array<string>;
    chatSessionMap: Record<string, ChatSession>;
}

/* equal to User in other system. */
export class QQClient {
    /* oicq Client object */
    client: Client;
    lock: PromiseLock;
    extra: QQClientExtra;
    /* timestamp used to clean no use client */
    accessTime: number; // s, since 1970-01-01 00:00:00 UTC
    #userPass: string; // user set password, not qq password
    #userPassKey: Buffer;
    #storage: Low<QQClientStorage>;
    #lastUserPassFailed: number; //防暴力猜解用户密码
    #userPassFailedCount: number; //防暴力猜解用户密码
    constructor (qid: number, userPass: string, platform: Platform) {
        const data_dir = getPathInData("clients", qid.toString());
        this.client = createClient(qid, {
            platform,
            log_level: "off",
            ignore_self: false,
            cache_group_member: false,
            data_dir,
        });
        this.lock = new PromiseLock();
        this.extra = {
            subscribtions: [],
            chatMessageDatabase: new Map(),
        };
        this.accessTime = Date.now() / 1_000;
        this.#userPass = userPass;
        this.#userPassKey = createKey(userPass);
        this.#storage = new Low<QQClientStorage>(new JSONFile(getPathWithin(data_dir, "storage.json")));
        this.#lastUserPassFailed = 0;
        this.#userPassFailedCount = 0;
    }
    async init () {
        await this.lock.do(async () => {
            await ensureDirPromise(this.client.dir);
            await this.#storage.read();
            this.#storage.data = this.#storage?.data ?? {
                chatSessions: [],
                chatSessionMap: {},
            };
            if (this.#storage.data.userPassHash && this.#storage.data.userPassHash !== hashPassword(this.#userPass)) {
                // 检查userPass是否发生变化，如变化则清空用户文件夹(为了安全)
                await clearDirPromise(this.client.dir);
                this.#storage.data.chatSessions = [];
                logger.debug(`${this.client.dir} cleared.`);
            }
            this.#storage.data.userPassHash = hashPassword(this.#userPass);
            // 加载聊天历史记录
            await Promise.all(this.#storage.data.chatSessions.map(async (chatSessionId) => {
                const db = new AppendOnlyDatabase<Buffer>(getPathWithin(this.client.dir, `${chatSessionId}.aodb`), false);
                await db.init();
                this.extra.chatMessageDatabase.set(chatSessionId, db);
            }));
            // 注册事件
            const extra = this.extra;
            const messageCallback = (async (evt: Message) => {
                const message = SavedMessage.fromMessage(evt);
                await this.appendMessage(message, message.user_id === this.client.uin ? 0 : 1);
            }).bind(this);
            const selfMessageCallback = (async (evt: PrivateMessage) => {
                const message = SavedMessage.fromMessage(evt);
                message.group_id = evt.to_id;
                await this.appendMessage(message, 0);
            }).bind(this);
            this.client.on("system.login.qrcode", (evt) => { extra.loginImage = evt.image; });
            this.client.on("system.login.slider", () => { extra.loginError = "请使用扫码登录!"; });
            this.client.on("system.login.device", () => { extra.loginError = "请使用扫码登录!"; });
            this.client.on("system.login.error", (evt) => {
                extra.loginError = `${evt.message} | 首次登录请使用扫码登录!`;
                logger.info(`${this.client.uin} ${evt.message}`);
            });
            this.client.on("system.online", () => { logger.info(`${this.client.uin} 上线`); });
            this.client.on("system.offline.network", () => { logger.info(`${this.client.uin} 断线`); });
            this.client.on("system.offline.kickoff", () => { logger.info(`${this.client.uin} 踢下线`); });
            this.client.on("system.offline", () => { logger.info(`${this.client.uin} 下线`); });
            this.client.on("message", messageCallback);
            this.client.on("sync.message", selfMessageCallback);
            this.client.on("sync.read.group", (evt) => {
                const sessionId = SavedMessage.combineChatSessionId("group", evt.group_id);
                this.markReadedLocal(sessionId);
            });
            this.client.on("sync.read.private", (evt) => {
                const sessionId = SavedMessage.combineChatSessionId("private", evt.user_id);
                this.markReadedLocal(sessionId);
            });
        });
    }
    async close () {
        await this.lock.do(async () => {
            try {
                await this.#storage.write();
                for (const db of this.extra.chatMessageDatabase.values()) {
                    await db.close();
                }
                if (this.client.isOnline()) {
                    await this.client.logout(false);
                }
                logger.info(`${this.client.uin} 已注销`);
            } catch (e) {
                logger.warn(e);
            }
        });
    }
    async appendMessage (msg: SavedMessage, unread = 0) {
        this.lock.do(async () => {
            const chatSessionId = msg.getChatSessionId();
            let db = this.extra.chatMessageDatabase.get(chatSessionId);
            if (db === undefined) {
                // session not exist
                db = new AppendOnlyDatabase<Buffer>(getPathWithin(this.client.dir, `${chatSessionId}.aodb`), false);
                await db.init();
                this.extra.chatMessageDatabase.set(chatSessionId, db);
                if (this.#storage.data !== null) {
                    this.#storage.data.chatSessionMap[chatSessionId] = { sessionId: chatSessionId, unread };
                    if (!this.#storage.data.chatSessions.includes(chatSessionId)) {
                        this.#storage.data.chatSessions.push(chatSessionId);
                    }
                }
            } else {
                // session exist
                if (this.#storage.data !== null) {
                    this.#storage.data.chatSessionMap[chatSessionId].unread += unread;
                }
            }
            const buf = msg.toBuffer();
            const encrypted = await encrypt(this.#userPassKey, buf);
            const recordId = await db.addRecord(encrypted);
            msg.record_id = recordId >= 0 ? recordId : -1;
            // 对聊天session进行排序，将当前session放到最前面
            if (this.#storage.data !== null) {
                const index = this.#storage.data.chatSessions.indexOf(chatSessionId);
                this.#storage.data.chatSessions.splice(index, 1);
                this.#storage.data.chatSessions.unshift(chatSessionId);
            }
            // notify
            this.feedSubscribe(this.getGlobalId(), this); // 聊天session发生变化
            this.feedSubscribe(chatSessionId, msg);
        });
    }
    async getMessage (chatSessionId: string, index = -1, count = 15) {
        const db = this.extra.chatMessageDatabase.get(chatSessionId);
        const result: Array<SavedMessage> = [];
        if (db !== undefined && count > 0) {
            count = Math.min(count, 50);
            if (index < 0) {
                index = db.getSize() - count; // 取最后count条消息
                index = Math.max(index, 0);
            }
            const buffers = await db.getRecords(index, count);
            for (let i = 0; i < buffers.length; i++) {
                const decrypted = decrypt(this.#userPassKey, buffers[i]);
                const msg = SavedMessage.fromBuffer(decrypted);
                msg.record_id = index + i; // 附加record_id
                result.push(msg);
            }
        }
        return result;
    }
    getGlobalId () {
        return combineId(TYPECODE, this.client.uin.toString());
    }
    getChatSessions () {
        if (this.#storage.data !== null) {
            return this.#storage.data.chatSessions;
        } else {
            return [];
        }
    }
    getChatSession (chatSessionId: string) {
        const session = this.#storage.data?.chatSessionMap[chatSessionId];
        if (session) {
            if (session.title === undefined && session.avatarUrl === undefined) {
                const [type, uin] = SavedMessage.splitChatSessionId(chatSessionId);
                session.avatarUrl = "";
                session.title = uin.toString();
                try {
                    if (type == "private") {
                        const user = this.client.pickUser(uin);
                        session.avatarUrl = user.getAvatarUrl();
                        session.title = user.asFriend().nickname ?? uin.toString();
                    } else if (type == "group") {
                        const group = this.client.pickGroup(uin);
                        session.avatarUrl = group.getAvatarUrl();
                        session.title = group.name ?? uin.toString();
                    }
                } catch {
                    // 出问题了，下次再尝试
                    session.avatarUrl = undefined;
                    session.title = undefined;
                }
            }
            return session;
        } else {
            return null;
        }
    }
    markReadedLocal (chatSessionId: string) {
        const session = this.getChatSession(chatSessionId);
        if (session) {
            session.unread = 0;
            this.feedSubscribe(this.getGlobalId(), this); // 聊天session发生变化
        }
    }
    async markReadedRemote (chatSessionId: string) {
        const session = this.getChatSession(chatSessionId);
        if (session) {
            const [type, uin] = SavedMessage.splitChatSessionId(chatSessionId);
            if (type == "private") {
                const user = this.client.pickUser(uin);
                await user.markRead();
            } else if (type == "group") {
                const group = this.client.pickGroup(uin);
                await group.markRead();
            }
            session.unread = 0;
            this.feedSubscribe(this.getGlobalId(), this); // 聊天session发生变化
        }
    }
    async sendMessage (chatSessionId: string, content: MessageElem[], source?: Quotable) {
        const [type, uin] = SavedMessage.splitChatSessionId(chatSessionId);
        if (type === "private") {
            const msgRet = await this.client.pickUser(uin).sendMsg(content, source);
            let retry = 3;
            while (retry > 0) {
                retry--;
                await setTimeout(500);
                const msgs = await this.client.pickUser(uin).getChatHistory(undefined, 5);
                for (const pmsg of msgs) {
                    if (pmsg.seq === msgRet.seq && pmsg.rand === msgRet.rand) {
                        const msg = SavedMessage.fromMessage(pmsg);
                        msg.group_id = pmsg.to_id;
                        await this.appendMessage(msg);
                        return true;
                    }
                }
            }
        } else if (type === "group") {
            await this.client.pickGroup(uin).sendMsg(content, source);
            // 不用添加到消息列表。，会收到Group消息
            return true;
        } else if (type === "discuss") {
            const msgRet = await this.client.pickDiscuss(uin).sendMsg(content);
            for (let i = 0; i < content.length; i++) {
                if (content[i].type === "image") {
                    content[i] = { type: "text", text: "[图片发送成功，但不支持保存讨论组图片记录]" };
                }
            }
            const msg = SavedMessage.fromMessageReturn(msgRet, this.client.uin, uin, content, this.client.nickname, type);
            await this.appendMessage(msg);
            // QQ自己都放弃讨论组了，不支持了！
            return true;
        }
        return false;
    }
    touch () {
        this.accessTime = Date.now() / 1_000;
    }
    checkUserPass (ps: string) {
        const now = Date.now() / 1_000;
        if (now - this.#lastUserPassFailed < USER_PASS_RETRY_INTERVAL) {
            this.#lastUserPassFailed = now;
            return false;
        } else if (this.#lastUserPassFailed > 0) {
            this.#lastUserPassFailed = 0;
            this.#userPassFailedCount = 0;
        }
        if (ps === this.#userPass) {
            this.#userPassFailedCount = 0;
            return true;
        } else {
            this.#userPassFailedCount += 1;
            if (this.#userPassFailedCount >= USER_PASS_RETRY_LIMIT) {
                this.#lastUserPassFailed = now;
                logger.info(`${this.client.uin} 用户密码错误次数太多`);
            }
            return false;
        }
    }
    createSubscribe <T> (resourceId: string, subscribeId: string) {
        const sub = new Subscribtion<T>(resourceId, subscribeId);
        this.extra.subscribtions.push(sub as Subscribtion<unknown>);
        return sub;
    }
    feedSubscribe <T> (resourceId: string, value: T) {
        this.extra.subscribtions.forEach((sub) => {
            if (sub.hasId(resourceId)) {
                sub.feedNext(value);
            }
        });
    }
    closeSubscribe (subscribeId: string) {
        for (let i = 0; i < this.extra.subscribtions.length; i++) {
            const sub = this.extra.subscribtions[i];
            if (sub.hasId(subscribeId)) {
                sub.close();
                this.extra.subscribtions.splice(i, 1);
                i -= 1;
            }
        }
    }
}

export const initQQClientModule = () => {
    let cleanTask = true;
    const cleanTaskPromise = (async () => {
        // clean task
        while (cleanTask) {
            await setTimeout(100);
            checkAndClearQQClient();
        }
    })(); // running till cleanTask == false
    registerBeforeExit(async () => {
        cleanTask = false;
        const pms = [];
        for (const qclient of clientMap.values()) {
            pms.push(qclient.close());
        }
        await Promise.all(pms);
        await cleanTaskPromise;
        logger.debug("exitTask finished.");
    });
};

export const getQQClient = (qid: number) => {
    const qclient = clientMap.get(qid);
    if (qclient) {
        qclient.touch();
        return qclient;
    } else {
        return null;
    }
};

export const removeQQClient = (qid: number) => {
    if (clientMap.has(qid)) {
        clientMap.delete(qid);
        return true;
    } else {
        return false;
    }
};

export const createQQClient = (qid: number, userPass: string, platform: Platform) => {
    const qclient: QQClient = new QQClient(qid, userPass, platform);
    clientMap.set(qid, qclient);
    return qclient;
};

export const checkAndClearQQClient = () => {
    const now = Date.now() / 1_000;
    if (now - lastCleanTime < CLIENT_IDLE_CHECK_INTERVAL) {
        return;
    }
    lastCleanTime = now;
    for (const [qid, qclient] of clientMap.entries()) {
        const timeOffset = (now - qclient.accessTime);
        if ((!qclient.client.isOnline()) && (timeOffset > CLIENT_IDLE_BEFORE_CLEAN)) {
            removeQQClient(qid);
        }
        if (timeOffset > CLIENT_IDLE_BEFORE_LOGOUT) {
            // logout
            qclient.close(); // don't wait this Promise
            qclient.touch();
        }
    }
};
