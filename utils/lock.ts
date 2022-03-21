type Resolver = (value: unknown) => void;

export class PromiseLock {
    #locked = false;
    #waitResolver: Array<Resolver> = new Array<Resolver>();
    constructor () {
        this.do = this.do.bind(this); // make sure this point right.
    }
    lock () {
        if (this.#locked) {
            return new Promise((resolve: Resolver) => {
                this.#waitResolver.push(resolve);
            });
        } else {
            this.#locked = true;
            return Promise.resolve(null);
        }
    }
    unlock () {
        if (this.#locked) {
            this.#locked = false;
        }
        if (this.#waitResolver.length > 0) {
            this.#locked = true;
            this.#waitResolver.splice(0, 1)[0](null);
        }
    }
    isLocked () {
        return this.#locked;
    }
    async do <T> (func: () => Promise<T>) {
        await this.lock();
        try {
            return await func();
        } finally {
            this.unlock();
        }
    }
}
