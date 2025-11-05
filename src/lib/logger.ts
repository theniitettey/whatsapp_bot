const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const DEFAULT = (process.env.LOG_LEVEL || "info") as Level;

function timestamp() {
  return new Date().toISOString();
}

function log(level: Level, ...args: any[]) {
  if (LEVELS[level] < LEVELS[DEFAULT]) return;
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  console.log(prefix, ...args);
}

export const logger = {
  debug: (...args: any[]) => log("debug", ...args),
  info: (...args: any[]) => log("info", ...args),
  warn: (...args: any[]) => log("warn", ...args),
  error: (...args: any[]) => log("error", ...args),
};

export default logger;
