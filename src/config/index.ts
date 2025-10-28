import dotenv from "dotenv";
dotenv.config();

const CONFIG = {
  PORT: process.env.PORT || 3000,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "",
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID || "",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "",
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL || "",
};

export default CONFIG;
