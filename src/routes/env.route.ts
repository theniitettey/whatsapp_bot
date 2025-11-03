import { Router, Request } from "express";
import fs from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import { requireAuth } from "../middleware/auth";

const router = Router();
const ENV_PATH = path.join(process.cwd(), ".env");

// NOTE: PORT and any Vite/frontend port values are intentionally NOT allowed
// to be modified via the API. Those should be managed via deployment config
// or the CLI with caution. Keep only application-level keys here.
const ALLOWED_KEYS = new Set([
  "WHATSAPP_TOKEN",
  "PHONE_NUMBER_ID",
  "VERIFY_TOKEN",
  "EXTERNAL_API_URL",
  "FALLBACK_MESSAGE",
  "AUTH_SECRET",
]);

const SENSITIVE_KEYS = new Set(["WHATSAPP_TOKEN", "AUTH_SECRET"]);

async function readEnvFile() {
  try {
    const raw = await fs.readFile(ENV_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const obj: Record<string, string> = {};
    for (const line of lines) {
      if (!line || line.trim().startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      obj[key] = value;
    }
    return obj;
  } catch (err) {
    return {};
  }
}

async function writeEnvFile(obj: Record<string, string>) {
  const lines = Object.entries(obj).map(([k, v]) => `${k}=${v}`);
  await fs.writeFile(ENV_PATH, lines.join("\n"), "utf8");
}

function maskValue(v?: string) {
  if (!v) return "";
  if (v.length <= 10) return "****";
  return `${v.slice(0, 6)}...${v.slice(-4)}`;
}

function isRequestAuthed(req: Request) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length);
  try {
    jwt.verify(token, CONFIG.AUTH_SECRET);
    return true;
  } catch {
    return false;
  }
}

// GET /api/env - returns allowed keys; sensitive keys are masked unless request is authenticated
router.get("/", async (req, res) => {
  const env = await readEnvFile();
  const authed = isRequestAuthed(req);
  const out: Record<string, string> = {};
  for (const k of Object.keys(env)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (SENSITIVE_KEYS.has(k) && !authed) {
      out[k] = maskValue(env[k]);
    } else {
      out[k] = env[k];
    }
  }
  res.json(out);
});

// POST /api/env - protected - accepts { key, value } or { updates: { key: value } }
router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const env = await readEnvFile();

    const updates: Record<string, string> = {};
    if (body.updates && typeof body.updates === "object") {
      Object.assign(updates, body.updates);
    } else if (body.key) {
      updates[body.key] = body.value ?? "";
    } else {
      return res.status(400).json({ error: "Missing key or updates" });
    }

    // validate keys
    for (const k of Object.keys(updates)) {
      if (!ALLOWED_KEYS.has(k)) {
        return res.status(400).json({ error: `Key not allowed: ${k}` });
      }
    }

    for (const [k, v] of Object.entries(updates)) {
      env[k] = String(v ?? "");
      process.env[k] = String(v ?? "");
    }

    await writeEnvFile(env);
    res.json({ ok: true, updated: Object.keys(updates) });
  } catch (err) {
    console.error("Failed to update env:", err);
    res.status(500).json({ error: "Failed to update env" });
  }
});

export default router;
