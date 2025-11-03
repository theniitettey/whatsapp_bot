import dotenv from "dotenv";
dotenv.config();

const CONFIG = {
  PORT: process.env.PORT || 3000,
  WHATSAPP_TOKEN: "EAAKu6GNXEiUBP5yGBzZCztYXLrZBqOMoYu2R0oAqbtxU1xe5e7irj9ZB6ayXP1xirskJpiiZCZCoIoBj7Xg71KEflNSH637ztWZC00zJxqQrpZCl9lpQ2huZAoTfQrbyOCXBsV8lETKxYaUQsZAncNbRgJNhs76jNMYHLoymd7m49UvaoXcDhvc1Hu7U9BYsBerbMHiTZBhLyxBR0W3cUTRxKtvhzhK6fLP6fGGB7HZCGo272WgYTqthkBsTMbqOR6DPdG05M3lLgtDZCpDQ6veowyxWRSFvHE2ly3aYwzQZD",
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID || "",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "",
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL || "",
  FALLBACK_MESSAGE:
    process.env.FALLBACK_MESSAGE ||
    "Bossu! Ebi like we no get answer for your matter now, but no wahala, we go try again later.",
};

export default CONFIG;
