import { WhatsappService } from "./whatsapp.service";
import { listSeenUsers } from "./userStore";
import logger from "../lib/logger";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
// Use require to avoid compile-time type dependency if node-cron isn't installed yet in the environment
let cron: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cron = require("node-cron");
} catch (err) {
  logger.warn("node-cron not installed; scheduled jobs disabled");
  // Fallback stub so the module can be loaded without crashing. validate() returns false
  // so scheduling is skipped; schedule() returns a no-op task object.
  cron = {
    validate: (_: string) => false,
    schedule: (_: string, fn?: Function) => {
      return {
        start: () => {},
        stop: () => {},
        destroy: () => {},
      } as any;
    },
  } as any;
}
type ScheduledTask = any;

const DATA_DIR = path.resolve(process.cwd(), "data");
const SCHEDULED_FILE = path.join(DATA_DIR, "scheduled-notifications.json");

type JobMeta = {
  id: string;
  message: string;
  cron: string;
  to?: string[];
  isAll?: boolean;
  createdAt: number;
};

type NotifyResult = {
  to: string;
  ok: boolean;
  resp?: any;
  error?: string;
};

let persistedJobs: Record<string, JobMeta> = {};
const activeTasks: Map<string, ScheduledTask> = new Map();

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    logger.error("Failed to create data dir:", err);
  }
}

async function loadPersistedJobs() {
  try {
    await ensureDataDir();
    const exists = await fs
      .stat(SCHEDULED_FILE)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      await fs.writeFile(SCHEDULED_FILE, JSON.stringify({}, null, 2), "utf8");
      persistedJobs = {};
      return;
    }
    const raw = await fs.readFile(SCHEDULED_FILE, "utf8");
    persistedJobs = raw ? JSON.parse(raw) : {};
  } catch (err) {
    logger.error("Failed to load persisted scheduled jobs:", err);
    persistedJobs = {};
  }
}

async function persistJobs() {
  try {
    await ensureDataDir();
    await fs.writeFile(
      SCHEDULED_FILE,
      JSON.stringify(persistedJobs, null, 2),
      "utf8"
    );
  } catch (err) {
    logger.error("Failed to persist scheduled jobs:", err);
  }
}

async function sendNotification(
  message: string,
  to?: string[],
  isAll?: boolean
) {
  const targets = isAll
    ? listSeenUsers()
    : to && to.length
    ? to
    : listSeenUsers();
  logger.info("Sending notification to", targets.length, "users");
  const results: NotifyResult[] = [];
  for (const t of targets) {
    try {
      const resp = await WhatsappService.sendTextMessage(t, message);
      results.push({ to: t, ok: true, resp });
    } catch (err: any) {
      logger.error("Failed to send notification to", t, err?.message ?? err);
      results.push({ to: t, ok: false, error: String(err?.message ?? err) });
    }
  }
  return results;
}

/**
 * Schedule a new cron job and persist metadata so scheduled jobs survive restarts.
 * returns job id on success, null on failure
 */
function scheduleNotificationsCron(
  message: string,
  cronExpr: string,
  to?: string[],
  isAll?: boolean
) {
  try {
    if (!cron.validate(cronExpr)) {
      logger.warn("Invalid cron expression:", cronExpr);
      return null;
    }
    const id = randomUUID();
    const meta: JobMeta = {
      id,
      message,
      cron: cronExpr,
      to,
      isAll,
      createdAt: Date.now(),
    };
    // create scheduled task
    const task = cron.schedule(cronExpr, () => {
      logger.info("Executing scheduled job", id);
      void sendNotification(message, to, isAll).catch((e) => logger.error(e));
    });
    activeTasks.set(id, task);
    persistedJobs[id] = meta;
    void persistJobs();
    logger.info("Scheduled notifications job added:", id, cronExpr);
    return id;
  } catch (err: any) {
    logger.error("Failed to schedule cron job:", err?.message ?? err);
    return null;
  }
}

function stopScheduledNotifications() {
  for (const [id, task] of activeTasks.entries()) {
    try {
      task.stop();
    } catch (err) {
      logger.warn("Error stopping task", id, err);
    }
  }
  activeTasks.clear();
  logger.info("Stopped all scheduled notifications");
}

function listScheduledJobs() {
  return Object.values(persistedJobs || {});
}

async function removeScheduledJob(id: string) {
  const task = activeTasks.get(id);
  if (task) {
    try {
      task.stop();
    } catch (err) {
      logger.warn("Error stopping task", id, err);
    }
    activeTasks.delete(id);
  }
  if (persistedJobs[id]) {
    delete persistedJobs[id];
    await persistJobs();
    logger.info("Removed scheduled job", id);
    return true;
  }
  return false;
}

async function initScheduler() {
  await loadPersistedJobs();
  // restore tasks
  for (const meta of Object.values(persistedJobs)) {
    try {
      if (!cron.validate(meta.cron)) {
        logger.warn(
          "Skipping invalid cron in persisted job",
          meta.id,
          meta.cron
        );
        continue;
      }
      const task = cron.schedule(meta.cron, () => {
        logger.info("Executing restored scheduled job", meta.id);
        void sendNotification(meta.message, meta.to, (meta as any).isAll).catch(
          (e) => logger.error(e)
        );
      });
      activeTasks.set(meta.id, task);
      logger.info("Restored scheduled job", meta.id, meta.cron);
    } catch (err) {
      logger.error("Failed to restore job", meta.id, err);
    }
  }
}

// initialize on load
void initScheduler();

export const NotificationService = {
  sendNotification,
  scheduleNotificationsCron,
  stopScheduledNotifications,
  listScheduledJobs,
  removeScheduledJob,
};

export default NotificationService;
