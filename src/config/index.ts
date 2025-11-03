import dotenv from "dotenv";
dotenv.config();

const CONFIG = {
  PORT: process.env.PORT || 3000,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "",
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID || "",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "",
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL || "",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  FALLBACK_MESSAGE:
    process.env.FALLBACK_MESSAGE ||
    "Bossu! Ebi like we no get answer for your matter now, but no wahala, we go try again later.",
  AUTH_SECRET: process.env.AUTH_SECRET || "change_this_secret",
};

export default CONFIG;
