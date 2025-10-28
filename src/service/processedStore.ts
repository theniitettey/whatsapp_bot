import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "processed-ids.json");

// default TTL: 24 hours (ms)
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

let store = new Map<string, number>();
let initialized = false;

async function init() {
  if (initialized) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const exists = await fs
      .stat(FILE_PATH)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      const raw = await fs.readFile(FILE_PATH, "utf8");
      const obj = raw ? JSON.parse(raw) : {};
      if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([k, v]) => store.set(k, v as number));
      }
    } else {
      await fs.writeFile(FILE_PATH, JSON.stringify({}, null, 2), "utf8");
    }

    initialized = true;
  } catch (err) {
    console.error("processedStore init failed:", err);
  }
}

function cleanup(ttl = DEFAULT_TTL) {
  const now = Date.now();
  for (const [id, ts] of store.entries()) {
    if (now - ts > ttl) store.delete(id);
  }
}

function isProcessed(id?: string | null, ttl = DEFAULT_TTL): boolean {
  if (!id) return false;
  if (!initialized) void init();
  cleanup(ttl);
  return store.has(id);
}

async function markProcessed(id: string): Promise<void> {
  if (!id) return;
  if (!initialized) await init();
  store.set(id, Date.now());
  try {
    await fs.writeFile(
      FILE_PATH,
      JSON.stringify(Object.fromEntries(store), null, 2),
      "utf8"
    );
  } catch (err) {
    console.error("processedStore write failed:", err);
  }
}

// Initialize in background
void init();

export { isProcessed, markProcessed };
