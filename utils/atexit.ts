let inited = false;
const callbacks = new Array<CallableFunction>();

export const registerBeforeExit = (callback: CallableFunction) => {
    if (!inited) {
        [
            "SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT",
            "SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM",
        ].forEach(function (sig) {
            process.on(sig, function () {
                console.log(sig);
                process.emit("beforeExit", 0);
            });
        });
        process.on("beforeExit", async (code) => {
            for await (const cb of callbacks) {
                try {
                    await cb();
                } catch {
                    return;
                }
            }
            console.log("exiting...", code);
            process.exit(code);
        });
        inited = true;
    }
    callbacks.push(callback);
};

export const unregisterBeforeExit = (callback: CallableFunction) => {
    const index = callbacks.indexOf(callback);
    if (index >= 0) {
        callbacks.splice(index, 1);
    }
};
