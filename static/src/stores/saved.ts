import { atom, onSet } from "nanostores";

const LOCALSOTRAGE_QID = "qid";
const LOCALSOTRAGE_USER_PASS = "userPass";
// 初始化store
const getInLocalStorage = <T>(k: string, def: T, cast: ((v: string) => T) | undefined = undefined) => {
    const v = localStorage.getItem(k);
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

// 设置store事件
onSet(qid, ({ newValue }) => {
    localStorage.setItem(LOCALSOTRAGE_QID, newValue.toString());
});
onSet(userPass, ({ newValue }) => {
    localStorage.setItem(LOCALSOTRAGE_USER_PASS, newValue);
});
