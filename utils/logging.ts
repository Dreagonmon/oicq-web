import { getPathInData, ensureDir } from "./env.js";
import log4js from "log4js";

export const initLog = () => {
    const logDirPath = getPathInData("logs");
    ensureDir(logDirPath);
    const logPath = getPathInData("logs", "app.log");
    log4js.configure({
        appenders: {
            "stdout": {
                type: "stdout",
            },
            "logfile": {
                type: "dateFile",
                filename: logPath,
                keepFileExt: true,
                numBackups: 30,
            },
            "logfilefilter": {
                type: "logLevelFilter",
                appender: "logfile",
                level: "info",
            },
        },
        categories: {
            default: {
                appenders: ["stdout", "logfilefilter"],
                level: "debug",
            },
        },
    });
};

