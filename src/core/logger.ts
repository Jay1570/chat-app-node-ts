import fs from "fs";
import path from "path";
import chalk from "chalk";
import dayjs from "dayjs";
import env from "../config/env.js";
import { getRequestId } from "./requestContext.js";

type Level = "info" | "error" | "warn" | "debug";

const isProd = env.NODE_ENV === "production";
const logToFile = env.LOG_TO_FILE === "true";

const logDir = "logs";

if (logToFile && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// ---------------- STREAMS ----------------

let currentDate = "";
let accessStream: fs.WriteStream | null = null;
let errorStream: fs.WriteStream | null = null;
let appStream: fs.WriteStream | null = null;

const getDate = () => dayjs().format("YYYY-MM-DD");

const handleStreamError = (err: Error) => {
    console.error("Log stream error:", err.message);
};

const createStreams = () => {
    const date = getDate();

    if (date === currentDate) return;

    currentDate = date;

    accessStream?.end();
    errorStream?.end();
    appStream?.end();

    accessStream = fs.createWriteStream(
        path.join(logDir, `access-${date}.log`),
        { flags: "a" },
    );

    accessStream.on("error", handleStreamError);

    errorStream = fs.createWriteStream(path.join(logDir, `error-${date}.log`), {
        flags: "a",
    });

    errorStream.on("error", handleStreamError);

    appStream = fs.createWriteStream(path.join(logDir, `app-${date}.log`), {
        flags: "a",
    });

    appStream.on("error", handleStreamError);
};

const getColor = (level: Level) => {
    switch (level) {
        case "info":
            return chalk.blue;
        case "error":
            return chalk.red;
        case "warn":
            return chalk.yellow;
        case "debug":
            return chalk.gray;
    }
};

const write = (level: Level, text: string) => {
    if (!logToFile) return;

    createStreams();

    appStream?.write(text + "\n");

    if (level === "error") {
        errorStream?.write(text + "\n");
    } else {
        accessStream?.write(text + "\n");
    }
};

const log = (level: Level, message: string, meta?: unknown) => {
    const time = dayjs().format("HH:mm:ss");
    const requestId = getRequestId();

    const logObject = {
        time,
        level,
        requestId,
        message,
        meta,
    };

    // ---------- PROD JSON ----------
    if (isProd) {
        const json = JSON.stringify(logObject);
        console.log(json);
        write(level, json);
        return;
    }

    // ---------- DEV PRETTY ----------
    const color = getColor(level);

    const text =
        `${chalk.gray(time)} ` +
        `${color(level.toUpperCase())} ` +
        `${chalk.cyan(requestId ?? "-")} ` +
        `${message}`;

    console.log(text, "\n", meta);

    write(level, JSON.stringify(logObject));
};

export const logger = {
    info: (msg: string, meta?: unknown) => log("info", msg, meta),
    error: (msg: string, meta?: unknown) => log("error", msg, meta),
    warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
    debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
};
