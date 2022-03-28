import { Quotable, Forwardable, MessageElem, Message, PrivateMessage, GroupMessage, DiscussMessage, MessageRet } from "oicq";
import { combineId, divideId } from "../schema/types/node.js";
type MessageType = "group" | "discuss" | "private" | "unknown";
type MessageCodeType = "GMSG" | "DMSG" | "PMSG" | "UMSG";
type MessageSubType = "group" | "friend" | "other" | "self" | "normal" | "anonymous" | "unknown";

export const TYPE_CODE_MAP: Record<MessageType, MessageCodeType> = {
    "group": "GMSG",
    "discuss": "DMSG",
    "private": "PMSG",
    "unknown": "UMSG",
};

export const TYPE_CODE_MAP_R: Record<MessageCodeType, MessageType> = {
    "GMSG": "group",
    "DMSG": "discuss",
    "PMSG": "private",
    "UMSG": "unknown",
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
    atme: boolean;
    nickname: string;
    message_type: MessageType;
    sub_type: MessageSubType;
    constructor () {
        this.user_id = 0; // sender
        this.group_id = 0;
        this.message_id = "";
        this.time = 0;
        this.seq = 0;
        this.rand = 0;
        this.message = [];
        this.record_id = -1; // not assign id.
        this.atme = false;
        this.nickname = "";
        this.message_type = "unknown";
        this.sub_type = "unknown";
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
                smsg.message_type = msg.message_type in TYPE_CODE_MAP ? msg.message_type : "unknown";
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
        nickname = "",
        message_type: MessageType = "unknown",
        sub_type: MessageSubType = "unknown",
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
    static splitChatSessionId: (id: string) => [MessageType, number] = (id) => {
        const [code, value] = divideId(id);
        if (code in TYPE_CODE_MAP_R) {
            return [TYPE_CODE_MAP_R[code as MessageCodeType], Number.parseInt(value)];
        } else {
            return [TYPE_CODE_MAP_R["UMSG"], Number.parseInt(value)];
        }
    };
    static combineChatSessionId: (type: MessageType, id: number) => string = (type, id) => {
        let typecode = "UMSG";
        if (type && type in TYPE_CODE_MAP) {
            typecode = TYPE_CODE_MAP[type];
        }
        return combineId(typecode, id.toString());
    };
    getChatSessionId () {
        return SavedMessage.combineChatSessionId(this.message_type, this.group_id);
    }
    toBuffer () {
        return Buffer.from(JSON.stringify(this), "utf8");
    }
    toPlainString () {
        let text = "";
        for (const elem of this.message) {
            if (elem.type == "text") {
                text = text + elem.text;
            } else {
                text = text + `[${elem.type}]`;
            }
        }
        return text;
    }
}
