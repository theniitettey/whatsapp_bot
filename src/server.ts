import app from "./app";
import CONFIG from "./config";
import logger from "./lib/logger";

const PORT = CONFIG.PORT;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
