import { Quotable, Forwardable, MessageElem, Message, PrivateMessage, GroupMessage, DiscussMessage, MessageRet } from "oicq";
import { combineId } from "../schema/types/node.js";
type MessageType = "group" | "discuss" | "private" | string;
type MessageSubType = "group" | "friend" | "other" | "self" | "normal" | "anonymous" | string;
type Optional<T> = T | undefined;

export const TYPE_CODE_MAP: Record<MessageType, string> = {
    "group": "GMSG",
    "discuss": "DMSG",
    "private": "PMSG",
    // "unknown": "UMSG",
};

/* universal message */
export class SavedMessage implements Quotable, Forwardable {
    /* from id */
    user_id: number;
    group_id: number;
    message_id: string;
    time: number;
    seq: number;
    rand: number;
    message: MessageElem[];
    record_id: number;
    atme?: boolean;
    nickname?: string;
    message_type?: MessageType;
    sub_type?: MessageSubType;
    constructor () {
        // default value
        this.user_id = 0;
        this.group_id = 0;
        this.message_id = "";
        this.time = 0;
        this.seq = 0;
        this.rand = 0;
        this.record_id = -1; // not assign id.
        this.message = [];
    }
    static fromJSONObject (msg: SavedMessage) {
        const smsg = new SavedMessage();
        for (const k in msg) {
            (smsg as any)[k] = (msg as any)[k]; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return smsg;
    }
    static fromBuffer (buffer: Buffer) {
        const msgObj = JSON.parse(buffer.toString("utf8"));
        return SavedMessage.fromJSONObject(msgObj);
    }
    static fromMessage (msg: Message) {
        const smsg = new SavedMessage();
        if (msg instanceof Message) {
            smsg.time = msg.time;
            smsg.message = msg.message;
            smsg.nickname = msg.nickname;
            smsg.message_id = msg.message_id;
            smsg.seq = msg.seq;
            smsg.rand = msg.rand;
            if (msg instanceof PrivateMessage || msg instanceof GroupMessage || msg instanceof DiscussMessage) {
                smsg.user_id = msg.sender.user_id;
                smsg.nickname = msg.sender.nickname;
                smsg.message_type = msg.message_type;
                if (msg instanceof PrivateMessage || msg instanceof GroupMessage) {
                    smsg.sub_type = msg.sub_type;
                }
                if (msg instanceof GroupMessage || msg instanceof DiscussMessage) {
                    smsg.atme = msg.atme;
                }
                if (msg instanceof PrivateMessage) {
                    smsg.group_id = msg.sender.user_id;
                } else if (msg instanceof GroupMessage) {
                    smsg.group_id = msg.group_id;
                } else {
                    smsg.group_id = msg.discuss_id;
                }
            } else {
                smsg.user_id = msg.user_id;
                smsg.group_id = 0;
                smsg.nickname = msg.nickname;
            }
        } else {
            // unknow message
            return null;
        }
        return smsg;
    }
    static fromMessageReturn (
        msg: MessageRet,
        uin: number,
        message: MessageElem[],
        nickname: Optional<string> = undefined,
        message_type: Optional<MessageType> = undefined,
        sub_type: Optional<MessageSubType> = undefined,
    ) {
        const smsg = new SavedMessage();
        smsg.user_id = uin;
        smsg.message_id = msg.message_id;
        smsg.time = msg.time;
        smsg.seq = msg.seq;
        smsg.rand = msg.rand;
        smsg.message = message;
        smsg.nickname = nickname;
        smsg.message_type = message_type;
        smsg.sub_type = sub_type;
        return smsg;
    }
    getChatSessionId () {
        let typecode = "UMSG";
        if (this.message_type && this.message_type in TYPE_CODE_MAP) {
            typecode = TYPE_CODE_MAP[this.message_type];
        }
        return combineId(typecode, this.group_id.toString());
    }
    toBuffer () {
        return Buffer.from(JSON.stringify(this), "utf8");
    }
}
