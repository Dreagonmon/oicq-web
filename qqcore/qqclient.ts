import { PromiseLock } from "../utils/lock.js";
import { getPathInData } from "../utils/env.js";
import { createClient, Client, Platform } from "oicq";
import { Low, JSONFile } from "lowdb";

const CLIENT_IDLE_BEFORE_LOGOUT = 259200; // s, 60*60*24*3 = 3d
const CLIENT_IDLE_BEFORE_CLEAN = 3600; // s
const CLIENT_IDLE_CHECK_INTERVAL = 60; // s
/* Global QQClient Storage */
const clientMap: Map<number, QQClient> = new Map();
/* last clean time */
let lastCleanTime = 0;

/* equal to User in other system. */
export class QQClient {
    /* oicq Client object */
    client: Client;
    isOnline: boolean;
    lock: PromiseLock;
    extra: Record<string, unknown>;
    /* timestamp used to clean no use client */
    accessTime: number; // s, since 1970-01-01 00:00:00 UTC
    userPass: string; // user set password, not qq password
    constructor (qid: number, userPass: string, platform: Platform) {
        this.client = createClient(qid, {
            platform,
            log_level: "off",
            cache_group_member: false,
            data_dir: getPathInData("clients", qid.toString()),
        });
        this.isOnline = false;
        this.lock = new PromiseLock();
        this.extra = {};
        this.accessTime = Date.now() / 1_000;
        this.userPass = userPass;
    };
}

export const getQQClient = (qid: number) => {
    if (clientMap.has(qid)) {
        const qclient = clientMap.get(qid);
        qclient.accessTime = Date.now() / 1_000;
        return qclient;
    } else {
        return null;
    }
};

export const createQQClient = (qid: number, userPass: string, platform: Platform) => {
    const qclient: QQClient = new QQClient(qid, userPass, platform);
    clientMap.set(qid, qclient);
    return qclient;
};

export const checkAndClearQQClient = () => {
    const now = Date.now() / 1_000;
    if (now - lastCleanTime > CLIENT_IDLE_CHECK_INTERVAL) {
        return;
    }
    lastCleanTime = now;
    for (const [qid, qclient] of clientMap.entries()) {
        const timeOffset = (now - qclient.accessTime);
        if ((!qclient.isOnline) && (timeOffset > CLIENT_IDLE_BEFORE_CLEAN)) {
            clientMap.delete(qid);
        }
        if (timeOffset > CLIENT_IDLE_BEFORE_LOGOUT) {
            // logout
            qclient.client.logout(false); // don't wait this Promise
            qclient.isOnline = false;
            qclient.accessTime = Date.now() / 1_000;
        }
    }
};
