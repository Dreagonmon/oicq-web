import { ID } from "graphql-ws";
import { Context } from "graphql-ws/lib/server";
import { Extra } from "graphql-ws/lib/use/ws";
import { QQClient } from "./qqclient";

export interface ContextExtra extends Extra{
    qid?: number;
    /* when logined and authed, !== undefined */
    qclient?: QQClient;
}

export interface SubscribeContext {
    id: ID;
    extra: ContextExtra;
}

export type ContextWithExtra = Context<Record<string, unknown>, ContextExtra>
