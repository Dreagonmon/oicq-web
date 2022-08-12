export interface Message {
    recordId: number,
    atMe: boolean,
    sender: string,
    time: string,
    seq: string,
    rand: string,
    nickname: string,
    message: string,
}

export interface MessageElement {
    type: string,
    text?: string,
    url?: string,
    qq?: number,
    id?: number,
}
