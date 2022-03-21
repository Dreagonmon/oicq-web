// qqclient -> extra -> subscribe_object
// connect unregister on onComplete function.
export const SUB_MESSAGE = "MSGE";
export const SUB_UNREAD = "MURD";

export class Subscribtion<T> {
    #id: string; // graphql id
    #subscribeId: string; // subscribte_id
    #resolve?: (value: T) => void;
    #reject?: (reason?: unknown) => void;
    #closed: boolean;
    constructor (id: string, subscribeId: string) {
        this.#id = id;
        this.#subscribeId = subscribeId;
        this.#closed = false;
    }
    hasId (id: string) {
        if (this.#id == id || this.#subscribeId == id) return true;
        else return false;
    }
    waitNext () {
        if (this.#closed) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        }) as Promise<T>;
    }
    feedNext (value: T) {
        if (this.#resolve) {
            this.#resolve(value);
            this.#resolve = undefined;
            this.#reject = undefined;
        }
    }
    close () {
        if (this.#reject) {
            this.#reject();
            this.#resolve = undefined;
            this.#reject = undefined;
        }
        this.#closed = true;
    }
}
