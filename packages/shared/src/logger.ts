import pino from "pino";

/** Logger dasar dipakai fungsi bersama di package ini. App masing-masing (wa-bot, api) punya logger sendiri untuk kode aplikasinya. */
export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
