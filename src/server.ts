import app from "./app";
import CONFIG from "./config";

const PORT = CONFIG.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
