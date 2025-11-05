import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useTheme } from "./ThemeProvider";
import { Textarea } from "./ui/textarea";
import { PrestoQLogo } from "./PrestoQLogo";
import { ApiStatusIndicator } from "./ApiStatusIndicator";
import NotificationsPanel from "./NotificationsPanel";
import CONFIG from "../config";

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
}

const initialEnvVars: EnvVariable[] = [
  {
    id: "1",
    key: "WHATSAPP_API_TOKEN",
    value: "EAABwzLixnjYBO7ZCZCvLpqZBVZB",
    description: "WhatsApp Business API access token",
  },
  {
    id: "2",
    key: "WHATSAPP_PHONE_ID",
    value: "123456789012345",
    description: "WhatsApp phone number ID",
  },
  {
    id: "3",
    key: "WEBHOOK_VERIFY_TOKEN",
    value: "my_verify_token_12345",
    description: "Token for webhook verification",
  },
  {
    id: "4",
    key: "BUSINESS_ACCOUNT_ID",
    value: "987654321098765",
    description: "WhatsApp Business Account ID",
  },
  {
    id: "5",
    key: "BOT_RESPONSE_DELAY",
    value: "1000",
    description: "Delay in ms before bot responds",
  },
  {
    id: "6",
    key: "DATABASE_URL",
    value: "postgresql://user:pass@localhost:5432/db",
    description: "Primary database connection",
  },
  {
    id: "7",
    key: "REDIS_URL",
    value: "redis://localhost:6379",
    description: "Cache server URL",
  },
  {
    id: "8",
    key: "JWT_SECRET",
    value: "super_secret_key_12345",
    description: "JWT signing secret",
  },
];

interface EnvVariablesDashboardProps {
  onLogout?: () => void;
  token?: string | null;
}

export function EnvVariablesDashboard({
  onLogout,
  token,
}: EnvVariablesDashboardProps) {
  const API_BASE = CONFIG.API_BASE_URL;
  const [envVars, setEnvVars] = useState<EnvVariable[]>(initialEnvVars);
  const [loading, setLoading] = useState(false);

  // fetch env from backend on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/env`, { headers });
        if (!res.ok) {
          toast.error("Failed to load env");
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        const arr: EnvVariable[] = Object.entries(data).map(([k, v]) => ({
          id: k,
          key: k,
          value: String(v ?? ""),
          description: "",
        }));
        setEnvVars(arr);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load env");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
  });
  const [apiStatus, setApiStatus] = useState<
    "operational" | "degraded" | "down"
  >("operational");
  const [showModalValue, setShowModalValue] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const filteredVars = envVars.filter(
    (v) =>
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleValueVisibility = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddDialog = () => {
    setEditingVar(null);
    setFormData({ key: "", value: "", description: "" });
    setShowModalValue(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (envVar: EnvVariable) => {
    setEditingVar(envVar);
    setFormData({
      key: envVar.key,
      value: envVar.value,
      description: envVar.description || "",
    });
    setShowModalValue(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.key.trim() || !formData.value.trim()) {
      toast.error("Key and value are required");
      return;
    }

    const isDuplicate = envVars.some(
      (v) => v.key === formData.key && v.id !== editingVar?.id
    );

    if (isDuplicate) {
      toast.error("A variable with this key already exists");
      return;
    }

    try {
      const body = { key: formData.key, value: formData.value };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/env`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(err.error || "Failed to update env");
        return;
      }
      // reload env
      const re = await fetch(`${API_BASE}/env`, { headers });
      const data = await re.json();
      const arr: EnvVariable[] = Object.entries(data).map(([k, v]) => ({
        id: k,
        key: k,
        value: String(v ?? ""),
        description: "",
      }));
      setEnvVars(arr);
      toast.success(
        editingVar
          ? "Variable updated successfully"
          : "Variable added successfully"
      );
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update env");
    }
  };

  const handleDelete = async (id: string) => {
    const varToDelete = envVars.find((v) => v.id === id);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      // set value to empty string to remove
      const res = await fetch(`${API_BASE}/env`, {
        method: "POST",
        headers,
        body: JSON.stringify({ key: varToDelete?.key, value: "" }),
      });
      if (!res.ok) {
        toast.error("Failed to delete variable");
        return;
      }
      // reload
      const re = await fetch(`${API_BASE}/env`, { headers });
      const data = await re.json();
      const arr: EnvVariable[] = Object.entries(data).map(([k, v]) => ({
        id: k,
        key: k,
        value: String(v ?? ""),
        description: "",
      }));
      setEnvVars(arr);
      toast.success(`Deleted ${varToDelete?.key}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete variable");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex flex-col">
      <Toaster />

      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <PrestoQLogo
                className="h-10 w-10 sm:h-14 sm:w-14 flex-shrink-0"
                variant={theme === "light" ? "light" : "dark"}
              />
              <div>
                <h1 className="text-black dark:text-white leading-tight">
                  PrestoQ
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  WhatsApp Bot API
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black dark:bg-white flex items-center justify-center transition-colors duration-300 hover:opacity-80"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                )}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="h-10 w-10 sm:h-12 sm:w-auto sm:px-6 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-center sm:justify-start gap-2 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 hidden sm:inline">
                    Logout
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* API Status Indicator */}
          <div className="mb-6">
            <ApiStatusIndicator status={apiStatus} />
            <div className="mt-4">
              <NotificationsPanel token={token} />
            </div>
          </div>

          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-4 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm sm:text-base"
              />
            </div>
            <button
              onClick={openAddDialog}
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Add Variable
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Variables Section */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-3 sm:space-y-4">
            {filteredVars.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 sm:py-16"
              >
                <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-neutral-100 dark:bg-neutral-900 items-center justify-center mb-4">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-400" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  No variables found
                </p>
                <p className="text-neutral-400 dark:text-neutral-600 text-sm mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first API variable"}
                </p>
              </motion.div>
            ) : (
              filteredVars.map((envVar, index) => (
                <motion.div
                  key={envVar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  className="group relative rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-neutral-900/50 transition-all"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                          className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black dark:bg-white"
                        >
                          <code className="text-xs sm:text-sm text-white dark:text-black break-all">
                            {envVar.key}
                          </code>
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{
                            delay: index * 0.05 + 0.2,
                            duration: 0.3,
                          }}
                          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden"
                        >
                          <code className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 break-all">
                            {showValues[envVar.id]
                              ? envVar.value
                              : "•".repeat(Math.min(envVar.value.length, 40))}
                          </code>
                        </motion.div>
                        <button
                          onClick={() => toggleValueVisibility(envVar.id)}
                          className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
                          aria-label={
                            showValues[envVar.id] ? "Hide value" : "Show value"
                          }
                        >
                          {showValues[envVar.id] ? (
                            <EyeOff className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                          ) : (
                            <Eye className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                          )}
                        </button>
                      </div>

                      {envVar.description && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                          className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500"
                        >
                          {envVar.description}
                        </motion.p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditDialog(envVar)}
                        className="flex-1 sm:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-700 dark:text-neutral-300" />
                        <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                          Edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(envVar.id)}
                        className="h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0 rounded-full border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center transition-colors"
                        aria-label="Delete variable"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-black dark:text-white">
                    Server Connected
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  {envVars.length} environment variable
                  {envVars.length !== 1 ? "s" : ""} configured
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <p className="text-xs text-neutral-400 dark:text-neutral-600">
                    Last updated
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Just now
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                © 2024 PrestoQ. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Support
                </a>
                <a
                  href="#"
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  API Status
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl sm:rounded-3xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 max-w-[calc(100%-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              {editingVar ? "Edit Variable" : "Add New Variable"}
            </DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400 text-sm">
              {editingVar
                ? "Update the API variable details below"
                : "Add a new API variable to your WhatsApp bot configuration"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="key"
                className="text-black dark:text-white text-sm"
              >
                Key*
              </Label>
              <Input
                id="key"
                placeholder="e.g., WHATSAPP_API_TOKEN"
                value={formData.key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
                className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black dark:text-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="value"
                className="text-black dark:text-white text-sm"
              >
                Value*
              </Label>
              <div className="relative">
                <Input
                  id="value"
                  placeholder="e.g., your_api_token_here"
                  type={showModalValue ? "text" : "password"}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black dark:text-white text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowModalValue(!showModalValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
                  aria-label={showModalValue ? "Hide value" : "Show value"}
                >
                  {showModalValue ? (
                    <EyeOff className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-black dark:text-white text-sm"
              >
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of this API variable"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="rounded-xl sm:rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black dark:text-white min-h-[80px] sm:min-h-[100px] text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="h-11 sm:h-12 px-6 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-black dark:text-white text-sm w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="h-11 sm:h-12 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity text-sm w-full sm:w-auto"
            >
              {editingVar ? "Update" : "Add"} Variable
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
