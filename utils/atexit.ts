import log4js from "log4js";
import { setTimeout } from "timers/promises";

export type AtExitCallback = (() => void) | (() => Promise<void>);

const logger = log4js.getLogger("atexit");
let inited = false;
let exiting = false;
const callbacks = new Array<AtExitCallback>();

export const registerBeforeExit = (callback: AtExitCallback) => {
    if (!inited) {
        [
            "SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT",
            "SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM",
        ].forEach(function (sig) {
            process.on(sig, function () {
                logger.info(`catch signal ${sig}.`);
                process.emit("beforeExit", 0);
            });
        });
        process.on("beforeExit", async (code) => {
            if (exiting) {
                return;
            }
            exiting = true; // make sure only exit once.
            for await (const cb of callbacks) {
                try {
                    await cb();
                } catch (e) {
                    logger.error(e);
                    return;
                }
            }
            logger.info(`now we are ready to exit. exit status code is ${code}`);
            await setTimeout(2_000);
            process.exit(code); // lets do the force exit!
        });
        inited = true;
    }
    callbacks.push(callback);
};

export const unregisterBeforeExit = (callback: AtExitCallback) => {
    const index = callbacks.indexOf(callback);
    if (index >= 0) {
        callbacks.splice(index, 1);
    }
};
