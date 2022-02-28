import { atom, map, onSet, onStart, task } from "nanostores";
import { QQClient } from "../types/QQClient";
import { request } from "./graphql";

const GQL_LOGIN = `
mutation login($qid: String, $userPass: String) {
    login(qid: $qid, userPass: $userPass) {
        id
        qid
        isOnline
        loginImage
        loginError
    }
}
`;
interface GQL_LOGIN_RESULT {
    login?: QQClient;
}

const LOCALSOTRAGE_QID = "qid";
const LOCALSOTRAGE_USER_PASS = "userPass";
// 初始化store
const getInLocalStorage = <T>(k: string, def: T, cast: ((v: string) => T) | undefined = undefined) => {
    let v = localStorage.getItem(k);
    if (v === null) {
        return def;
    }
    if (cast) {
        return cast(v);
    }
    return (v as unknown) as T;
};

export const qid = atom<number>(getInLocalStorage(LOCALSOTRAGE_QID, 0, Number.parseInt));
export const userPass = atom<string>(getInLocalStorage(LOCALSOTRAGE_USER_PASS, ""));
export const client = map<QQClient>({});

// 设置store事件
onSet(qid, ({ newValue }) => {
    localStorage.setItem(LOCALSOTRAGE_QID, newValue.toString());
});
onSet(userPass, ({ newValue }) => {
    localStorage.setItem(LOCALSOTRAGE_USER_PASS, newValue);
});
onStart(client, () => {
    task(async () => {
        // TODO: 换成查询专用接口
        const res = await request<GQL_LOGIN_RESULT>(GQL_LOGIN, { qid: qid.get().toString(), userPass: userPass.get() });
        if (res.data && res.data.login && res.data.login.isOnline) {
            client.set(res.data.login);
        }
    });
});
