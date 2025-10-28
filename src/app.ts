import express, { Express } from "express";
import CONFIG from "./config";
import bodyParser from "body-parser";
import whatsappRoutes from "./routes/whatsapp.route";

const app: Express = express();

app.use(bodyParser.json());
app.use("/api/whatsapp", whatsappRoutes);

export default app;
