import { Quotable, Forwardable, MessageElem, Message, PrivateMessage, GroupMessage, DiscussMessage, MessageRet } from "oicq";
type MessageType = "group" | "discuss" | "private" | string;
type MessageSubType = "group" | "friend" | "other" | "self" | "normal" | "anonymous" | string;
/* universal message */
export class SavedMessage implements Quotable, Forwardable {
    /* from id */
    user_id: number;
    message_id: string;
    time: number;
    seq: number;
    rand: number;
    message: MessageElem[];
    atme?: boolean;
    nickname?: string;
    message_type?: MessageType;
    sub_type?: MessageSubType;
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
            } else {
                smsg.user_id = msg.user_id;
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
        nickname: string = undefined,
        message_type: MessageType = undefined,
        sub_type: MessageSubType = undefined,
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
}
