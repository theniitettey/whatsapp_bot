import dotenv from "dotenv";
// Load initial .env values. Later updates can write to process.env directly and
// the proxy below will reflect the new values immediately.
dotenv.config();

type ConfigShape = {
  PORT: number;
  ULTRAMSG_INSTANCE_ID: string;
  ULTRAMSG_TOKEN: string;
  EXTERNAL_API_URL: string;
  FRONTEND_ORIGIN: string;
  FALLBACK_MESSAGE: string;
  AUTH_SECRET: string;
};

// Hardcoded default for WHATSAPP_TOKEN kept for backward compatibility; in
// production you should set WHATSAPP_TOKEN in the environment.

function getPort(): number {
  const p = process.env.PORT;
  if (!p) return 3000;
  const n = Number(p);
  return Number.isFinite(n) ? n : 3000;
}

const handler: ProxyHandler<Partial<ConfigShape>> = {
  get(_, prop: string) {
    switch (prop) {
      case "PORT":
        return getPort();
      case "ULTRAMSG_INSTANCE_ID":
        return process.env.ULTRAMSG_INSTANCE_ID || "";
      case "ULTRAMSG_TOKEN":
        return process.env.ULTRAMSG_TOKEN || "";
      case "EXTERNAL_API_URL":
        return process.env.EXTERNAL_API_URL || "";
      case "FRONTEND_ORIGIN":
        return process.env.FRONTEND_ORIGIN || "http://localhost:5173";
      case "FALLBACK_MESSAGE":
        return (
          process.env.FALLBACK_MESSAGE ||
          "Bossu! Ebi like we no get answer for your matter now, but no wahala, we go try again later."
        );
      case "AUTH_SECRET":
        return process.env.AUTH_SECRET || "change_this_secret";
      default:
        return undefined;
    }
  },
  // allow reads like Object.keys(CONFIG) to work predictably
  ownKeys() {
    return [
      "PORT",
      "ULTRAMSG_INSTANCE_ID",
      "ULTRAMSG_TOKEN",
      "EXTERNAL_API_URL",
      "FRONTEND_ORIGIN",
      "FALLBACK_MESSAGE",
      "AUTH_SECRET",
    ];
  },
  getOwnPropertyDescriptor() {
    return {
      configurable: true,
      enumerable: true,
      writable: false,
      value: undefined,
    } as PropertyDescriptor;
  },
};

const CONFIG = new Proxy<Partial<ConfigShape>>(
  {} as Partial<ConfigShape>,
  handler
) as ConfigShape;

export default CONFIG;
