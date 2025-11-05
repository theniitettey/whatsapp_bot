import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import CONFIG from "../config";
import logger from "../lib/logger";

const DATA_DIR = path.resolve(process.cwd(), "data");
const SEEN_FILE_PATH = path.join(DATA_DIR, "seen-users.json");
const USERS_FILE_PATH = path.join(DATA_DIR, "users.json");

type UserRecord = {
  token?: string;
  refreshToken?: string | null;
  expiresAt?: number | null; // epoch ms
  [k: string]: any;
};

let seen = new Set<string>();
let users = new Map<string, UserRecord>();
let initialized = false;

async function initStore() {
  if (initialized) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // seen users
    const seenExists = await fs
      .stat(SEEN_FILE_PATH)
      .then(() => true)
      .catch(() => false);

    if (seenExists) {
      const raw = await fs.readFile(SEEN_FILE_PATH, "utf8");
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) arr.forEach((s: string) => seen.add(s));
    } else {
      await fs.writeFile(SEEN_FILE_PATH, JSON.stringify([], null, 2), "utf8");
    }

    // user accounts
    const usersExists = await fs
      .stat(USERS_FILE_PATH)
      .then(() => true)
      .catch(() => false);

    if (usersExists) {
      const raw = await fs.readFile(USERS_FILE_PATH, "utf8");
      const obj = raw ? JSON.parse(raw) : {};
      if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([k, v]) => users.set(k, v as UserRecord));
      }
    } else {
      await fs.writeFile(USERS_FILE_PATH, JSON.stringify({}, null, 2), "utf8");
    }

    initialized = true;
    // seed default accounts if not present
    try {
      const adminEmail = "admin@prestoghana.com";
      const staffEmail = "staff@prestoghana.com";
      if (!users.has(adminEmail)) {
        const hash = await bcrypt.hash("AdminPass123!", 10);
        await _setUser(adminEmail, { passwordHash: hash, role: "admin" });
        logger.info("Seeded default admin account:", adminEmail);
      }
      if (!users.has(staffEmail)) {
        const hash = await bcrypt.hash("StaffPass123!", 10);
        await _setUser(staffEmail, { passwordHash: hash, role: "staff" });
        logger.info("Seeded default staff account:", staffEmail);
      }
    } catch (err) {
      console.error("Failed to seed default users:", err);
    }
  } catch (err) {
    logger.error("Failed to initialize user store:", err);
    // keep working with in-memory only if disk fails
  }
}

/** Synchronous check (reads in-memory set). initStore() is called on startup but
 * this function intentionally stays synchronous for easy usage in request flow.
 */
function isNewUser(phone: string): boolean {
  if (!initialized) {
    // best-effort init (do not await here to keep sync signature)
    void initStore();
  }
  return !seen.has(phone);
}

/** Mark user seen and persist to disk asynchronously */
async function markUserSeen(phone: string): Promise<void> {
  try {
    if (!initialized) await initStore();
    if (!seen.has(phone)) {
      seen.add(phone);
      await fs.writeFile(
        SEEN_FILE_PATH,
        JSON.stringify([...seen], null, 2),
        "utf8"
      );
      logger.info("Marking user seen:", phone);
    }
  } catch (err) {
    logger.error("Failed to persist seen user:", err);
  }
}

// Initialize in background
void initStore();

/** USER ACCOUNT HELPERS */

function _getUser(phone: string): UserRecord | null {
  if (!initialized) void initStore();
  return users.get(phone) ?? null;
}

async function _setUser(phone: string, record: UserRecord): Promise<void> {
  try {
    if (!initialized) await initStore();
    users.set(phone, record);
    await fs.writeFile(
      USERS_FILE_PATH,
      JSON.stringify(Object.fromEntries(users), null, 2),
      "utf8"
    );
    logger.debug("Persisted user record for:", phone);
  } catch (err) {
    logger.error("Failed to persist user record:", err);
  }
}

/** Return a snapshot array of seen users (phone numbers) */
function listSeenUsers(): string[] {
  if (!initialized) void initStore();
  return [...seen];
}

/** Return a snapshot object of user accounts */
function listUsers(): Record<string, UserRecord> {
  if (!initialized) void initStore();
  return Object.fromEntries(users);
}

function isTokenExpired(phone: string): boolean {
  const u = _getUser(phone);
  if (!u || !u.token) return true;
  if (!u.expiresAt) return false; // no expiry means treat as valid
  return Date.now() >= u.expiresAt;
}

async function setToken(
  phone: string,
  token: string,
  expiresInSeconds?: number | null,
  refreshToken?: string | null
) {
  const record = _getUser(phone) || {};
  record.token = token;
  record.refreshToken = refreshToken ?? null;
  record.expiresAt = expiresInSeconds
    ? Date.now() + expiresInSeconds * 1000
    : null;
  await _setUser(phone, record);
}

async function clearToken(phone: string) {
  const record = _getUser(phone) || {};
  delete record.token;
  record.refreshToken = null;
  record.expiresAt = null;
  await _setUser(phone, record);
}

export {
  isNewUser,
  markUserSeen,
  // user account API
  _getUser as getUser,
  _setUser as setUser,
  isTokenExpired,
  setToken,
  clearToken,
  // lists
  listSeenUsers,
  listUsers,
};
