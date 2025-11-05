import app from "./app";
import CONFIG from "./config";
import logger from "./lib/logger";

const PORT = CONFIG.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log("✅ Server file loaded");
process.on("exit", (code) =>
  console.log("❌ Process exiting with code:", code)
);
process.on("uncaughtException", (err) =>
  console.error("💥 Uncaught Exception:", err)
);
process.on("unhandledRejection", (reason) =>
  console.error("💥 Unhandled Rejection:", reason)
);
