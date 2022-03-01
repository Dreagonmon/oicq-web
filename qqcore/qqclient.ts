import { PromiseLock } from "../utils/lock.js";
import { getPathInData, getPathWithin, ensureDirPromise, clearDirPromise } from "../utils/env.js";
import { registerBeforeExit } from "../utils/atexit.js";
import { setTimeout } from "timers/promises";
import { createClient, Client, Platform } from "oicq";
import { Low, JSONFile } from "lowdb";
import log4js from "log4js";
const logger = log4js.getLogger("qqclient");

const CLIENT_IDLE_BEFORE_LOGOUT = 259200; // s, 60*60*24*3 = 3d
const CLIENT_IDLE_BEFORE_CLEAN = 3600; // s
const CLIENT_IDLE_CHECK_INTERVAL = 60; // s
const USER_PASS_RETRY_INTERVAL = 300; // s
const USER_PASS_RETRY_LIMIT = 5; // times
/* Global QQClient Storage */
const clientMap: Map<number, QQClient> = new Map();
/* last clean time */
let lastCleanTime = 0;
export interface QQClientExtra {
    loginImage?: Buffer,
    loginError?: string,
}
interface QQClientStorage {
    userPass?: string;
}

/* equal to User in other system. */
export class QQClient {
    /* oicq Client object */
    client: Client;
    lock: PromiseLock;
    extra: QQClientExtra;
    /* timestamp used to clean no use client */
    accessTime: number; // s, since 1970-01-01 00:00:00 UTC
    userPass: string; // user set password, not qq password
    storage: Low<QQClientStorage>;
    #lastUserPassFailed: number; //防暴力猜解用户密码
    #userPassFailedCount: number; //防暴力猜解用户密码
    constructor (qid: number, userPass: string, platform: Platform) {
        const data_dir = getPathInData("clients", qid.toString());
        this.client = createClient(qid, {
            platform,
            log_level: "off",
            cache_group_member: false,
            data_dir,
        });
        this.lock = new PromiseLock();
        this.extra = {};
        this.accessTime = Date.now() / 1_000;
        this.userPass = userPass;
        this.storage = new Low<QQClientStorage>(new JSONFile(getPathWithin(data_dir, "storage.json")));
        this.#lastUserPassFailed = 0;
        this.#userPassFailedCount = 0;
    }
    async init () {
        await ensureDirPromise(this.client.dir);
        await this.storage.read();
        this.storage.data = this.storage?.data ?? {};
        if (this.storage.data.userPass && this.storage.data.userPass !== this.userPass) {
            // 检查userPass是否发生变化，如变化则清空用户文件夹(为了安全)
            await clearDirPromise(this.client.dir);
            logger.debug(`${this.client.dir} cleared.`);
        }
        this.storage.data.userPass = this.userPass;
        const extra = this.extra;
        // 注册登录事件
        this.client.on("system.login.qrcode", (evt) => { extra.loginImage = evt.image; });
        this.client.on("system.login.slider", () => { extra.loginError = "请使用扫码登录!"; });
        this.client.on("system.login.device", () => { extra.loginError = "请使用扫码登录!"; });
        this.client.on("system.login.error", (evt) => { extra.loginError = evt.message; });
        this.client.on("system.online", () => { logger.info(`${this.client.uin} 上线`); })
        this.client.on("system.offline", () => { logger.info(`${this.client.uin} 下线`); })
    }
    async close () {
        try {
            await this.storage.write();
            if (this.client.isOnline()) {
                await this.client.logout(false);
            }
        } catch (e) {
            logger.warn(e);
        }
    }
    touch () {
        this.accessTime = Date.now() / 1_000;
    }
    checkUserPass (ps: unknown) {
        const now = Date.now() / 1_000;
        if (now - this.#lastUserPassFailed < USER_PASS_RETRY_INTERVAL) {
            this.#lastUserPassFailed = now;
            return false;
        } else if (this.#lastUserPassFailed > 0) {
            this.#lastUserPassFailed = 0;
            this.#userPassFailedCount = 0;
        }
        if (ps === this.userPass) {
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
