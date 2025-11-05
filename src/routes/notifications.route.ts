import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { NotificationService } from "../service/notification.service";
import { listUsers, listSeenUsers } from "../service/userStore";
import logger from "../lib/logger";

const router = Router();

// POST /api/notifications/send
router.post("/send", requireAuth, async (req, res) => {
  try {
    const { message, to, isAll } = req.body || {};
    if (!message || typeof message !== "string")
      return res.status(400).json({ error: "Missing message" });
    const targets: string[] | undefined = Array.isArray(to) ? to : undefined;
    const results = await NotificationService.sendNotification(
      message,
      targets,
      Boolean(isAll)
    );
    res.json({ ok: true, results });
  } catch (err) {
    logger.error("Failed to send notifications:", err);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

// POST /api/notifications/schedule { message, cron }
// 'cron' should be a cron expression (e.g. '*/5 * * * *' for every 5 minutes)
router.post("/schedule", requireAuth, async (req, res) => {
  try {
    const { message, cron: cronExpr, to, isAll } = req.body || {};
    if (!message || !cronExpr)
      return res
        .status(400)
        .json({ error: "Missing message or cron expression" });
    const targets: string[] | undefined = Array.isArray(to)
      ? to
      : typeof to === "string"
      ? to
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;
    const id = NotificationService.scheduleNotificationsCron(
      String(message),
      String(cronExpr),
      targets,
      Boolean(isAll)
    );
    if (!id) return res.status(400).json({ error: "Invalid cron expression" });
    res.json({ ok: true, id });
  } catch (err) {
    logger.error("Failed to schedule notifications:", err);
    res.status(500).json({ error: "Failed to schedule notifications" });
  }
});

// GET /api/notifications/schedule -> list scheduled jobs
router.get("/schedule", requireAuth, async (req, res) => {
  try {
    const jobs = NotificationService.listScheduledJobs();
    res.json({ ok: true, jobs });
  } catch (err) {
    logger.error("Failed to list scheduled jobs:", err);
    res.status(500).json({ error: "Failed to list scheduled jobs" });
  }
});

// GET /api/notifications/users -> list user accounts and seen users
router.get("/users", requireAuth, async (req, res) => {
  try {
    const users = listUsers();
    const seen = listSeenUsers();
    res.json({ ok: true, users, seen });
  } catch (err) {
    logger.error("Failed to list users:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// DELETE /api/notifications/schedule/:id -> remove job
router.delete("/schedule/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const ok = await NotificationService.removeScheduledJob(id);
    if (!ok) return res.status(404).json({ error: "Job not found" });
    res.json({ ok: true });
  } catch (err) {
    logger.error("Failed to remove scheduled job:", err);
    res.status(500).json({ error: "Failed to remove scheduled job" });
  }
});

// POST /api/notifications/stop
router.post("/stop", requireAuth, async (req, res) => {
  try {
    NotificationService.stopScheduledNotifications();
    res.json({ ok: true });
  } catch (err) {
    logger.error("Failed to stop scheduled notifications:", err);
    res.status(500).json({ error: "Failed to stop scheduled notifications" });
  }
});

export default router;
