import { getPathInData } from "./env.js";
import { readFileSync } from "fs";
import * as hjson from "hjson";
import log4js from "log4js";

const logger = log4js.getLogger("config");
let configDB: object = undefined;

const initDB = () => {
    try {
        configDB = hjson.parse(readFileSync(getPathInData("config.hjson"), { encoding: "utf8" }));
        logger.info("config file loaded.");
    } catch {
        logger.warn("read config.json failed.");
        configDB = {};
    }
};

export const getConfig: <T>(key: string, fallback?: T) => T = (key, fallback) => {
    if (configDB === undefined) {
        initDB();
    }
    return configDB?.[key] ?? fallback;
};
