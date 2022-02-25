import { initEnv } from "./utils/env.js";
import { initLog } from "./utils/logging.js";
// init
initEnv();
initLog();

// start server
import { getConfig } from "./utils/config.js";
import { createHttpServer } from "./qqcore/server.js";
import log4js from "log4js";

const HOST = getConfig("serverHost", "localhost");
const PORT = getConfig("serverPort", 4000);
const SERVE_STATIC = getConfig("serverStaticPage", true);

const logger = log4js.getLogger("app");
const server = createHttpServer(SERVE_STATIC);
server.listen({ host: HOST, port: PORT }, () => {
    logger.info(`Listening on ${SERVE_STATIC ? "http://" : ""}${HOST}:${PORT}`);
});

/* eslint-disable */
// test below

/* eslint-enable */
