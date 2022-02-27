import { initEnv } from "./utils/env.js";
import { initLog } from "./utils/logging.js";
// init
initEnv();
initLog();
import log4js from "log4js";
const logger = log4js.getLogger("app");
import { initQQClientModule } from "./qqcore/qqclient.js";
initQQClientModule();

// start server
import { getConfig } from "./utils/config.js";
import { createHttpServer } from "./qqcore/server.js";
import { registerBeforeExit } from "./utils/atexit.js";
const HOST = getConfig("serverHost", "localhost");
const PORT = getConfig("serverPort", 4000);
const SERVE_STATIC = getConfig("serverStaticPage", true);
const server = createHttpServer(SERVE_STATIC === true);
registerBeforeExit(() => {
    server.close();
});
server.listen({ host: HOST, port: PORT }, () => {
    logger.info(`Listening on ${SERVE_STATIC ? "http://" : ""}${HOST}:${PORT}`);
});

/* eslint-disable */
// test below

/* eslint-enable */
