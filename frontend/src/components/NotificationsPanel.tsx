import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import CONFIG from "../config";

interface Props {
  token?: string | null;
}

export function NotificationsPanel({ token }: Props) {
  const API_BASE = CONFIG.API_BASE_URL;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [cronExpr, setCronExpr] = useState("*/5 * * * *");
  const [recipients, setRecipients] = useState("");
  const [isAll, setIsAll] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [usersList, setUsersList] = useState<Record<string, any> | null>(null);

  async function sendNow() {
    if (!message.trim()) return toast.error("Message is required");
    setSending(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const toArr = recipients
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const body: any = { message };
      if (isAll) body.isAll = true;
      else if (toArr.length) body.to = toArr;
      const res = await fetch(`${API_BASE}/notifications/send`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(e.error || "Failed to send notifications");
        return;
      }
      toast.success("Notifications queued/sent");
      setOpen(false);
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notifications");
    } finally {
      setSending(false);
    }
  }

  async function schedule() {
    if (!message.trim()) return toast.error("Message is required");
    if (!cronExpr.trim()) return toast.error("Cron expression is required");
    setSending(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const toArr = recipients
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const body: any = { message, cron: cronExpr };
      if (isAll) body.isAll = true;
      else if (toArr.length) body.to = toArr;
      const res = await fetch(`${API_BASE}/notifications/schedule`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(e.error || "Failed to schedule notifications");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.id) toast.success(`Scheduled (id: ${data.id})`);
      else toast.success("Notifications scheduled");
      setOpen(false);
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule notifications");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Notifications</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send WhatsApp Notification</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message to send to all seen users"
              rows={6}
            />

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="notif-mode"
                  checked={mode === "now"}
                  onChange={() => setMode("now")}
                />
                <span>Send now</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="notif-mode"
                  checked={mode === "schedule"}
                  onChange={() => setMode("schedule")}
                />
                <span>Schedule</span>
              </label>
            </div>

            {mode === "schedule" && (
              <div className="space-y-1">
                <Label>CRON expression</Label>
                <Input
                  value={cronExpr}
                  onChange={(e) => setCronExpr(e.target.value)}
                  placeholder="e.g. */5 * * * *"
                />
                <p className="text-xs text-neutral-500">
                  Use a cron expression for scheduling (minutes field first).
                  Example: <code>*/5 * * * *</code>
                </p>
              </div>
            )}
            <div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAll}
                  onChange={(e) => setIsAll(e.target.checked)}
                />
                <span>Send to all seen users</span>
              </label>
              <div className="mt-2">
                <Label>Recipients (optional)</Label>
                <Input
                  placeholder="Comma separated phone numbers, e.g. 233208860872"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  disabled={isAll}
                />
                <p className="text-xs text-neutral-500">
                  {isAll
                    ? "All seen users will receive this notification."
                    : "Leave empty to send to all seen users."}
                </p>
                <div className="mt-2">
                  <Button
                    onClick={async () => {
                      setUsersOpen(true);
                      if (usersList) return;
                      try {
                        const headers: Record<string, string> = {};
                        if (token) headers.Authorization = `Bearer ${token}`;
                        const res = await fetch(
                          `${API_BASE}/notifications/users`,
                          {
                            headers,
                          }
                        );
                        if (!res.ok) return;
                        const data = await res.json();
                        setUsersList(data?.users ?? null);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    View users
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="ghost">
              Cancel
            </Button>
            {mode === "now" ? (
              <Button onClick={sendNow} disabled={sending}>
                Send
              </Button>
            ) : (
              <Button onClick={schedule} disabled={sending}>
                Schedule
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* users dialog */}
      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Known Users</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {usersList ? (
              <div className="space-y-2 max-h-60 overflow-auto">
                {Object.entries(usersList).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{k}</div>
                      <div className="text-xs text-neutral-500">
                        {v?.role ?? ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>No users loaded</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setUsersOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NotificationsPanel;
