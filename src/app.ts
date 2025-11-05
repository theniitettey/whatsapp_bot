import express, { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import CONFIG from "./config";
import bodyParser from "body-parser";
import cors from "cors";
import whatsappRoutes from "./routes/whatsapp.route";
import authRoutes from "./routes/auth.route";
import envRoutes from "./routes/env.route";
import notificationsRoutes from "./routes/notifications.route";

const app: Express = express();

// JSON body parsing for API
app.use(bodyParser.json());

// CORS: allow frontend origin to call the API (configurable via FRONTEND_ORIGIN env)
const FRONTEND_ORIGIN = CONFIG.FRONTEND_ORIGIN;
app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server or tools like curl (no origin)
      if (!origin) return callback(null, true);

      // allow configured frontend and localhost
      if (
        origin === FRONTEND_ORIGIN ||
        origin === "http://localhost:5173" ||
        origin === "http://localhost:5174"
      ) {
        return callback(null, true);
      }
      const DEV_TUNNEL_RE =
        /^https?:\/\/(?:[A-Za-z0-9-]+\.)+devtunnels\.ms(?::\d+)?$/;

      const ULTRAMSG_API_RE = /^https?:\/\/api\.ultramsg\.com(?::\d+)?$/;

      if (ULTRAMSG_API_RE.test(origin)) return callback(null, true);
      if (DEV_TUNNEL_RE.test(origin)) return callback(null, true);

      // otherwise reject
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // Some dev tunnels or proxies (or misconfigured clients) send additional
    // headers like Access-Control-Allow-Origin; be permissive for dev but
    // keep production tighter if needed.
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Origin",
      "Accept",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
    ],
    credentials: true,
  })
);

// API routes are namespaced under /api
app.use("/api/whatsapp", whatsappRoutes);
// auth and env routes
app.use("/api/auth", authRoutes);
app.use("/api/env", envRoutes);
// notifications
app.use("/api/notifications", notificationsRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Presto WhatsApp Bot API is running.");
});

// NOTE: frontend is served separately (dev: Vite dev server, prod: static host or
// `npm --prefix frontend run preview`). We purposely do NOT serve the frontend
// from Express so the two servers run on separate ports.

export default app;
