import express, { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import CONFIG from "./config";
import bodyParser from "body-parser";
import cors from "cors";
import whatsappRoutes from "./routes/whatsapp.route";
import authRoutes from "./routes/auth.route";
import envRoutes from "./routes/env.route";

const app: Express = express();

// JSON body parsing for API
app.use(bodyParser.json());

// CORS: allow frontend origin to call the API (configurable via FRONTEND_ORIGIN env)
const FRONTEND_ORIGIN = CONFIG.FRONTEND_ORIGIN;
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// API routes are namespaced under /api
app.use("/api/whatsapp", whatsappRoutes);
// auth and env routes
app.use("/api/auth", authRoutes);
app.use("/api/env", envRoutes);

// NOTE: frontend is served separately (dev: Vite dev server, prod: static host or
// `npm --prefix frontend run preview`). We purposely do NOT serve the frontend
// from Express so the two servers run on separate ports.

export default app;
