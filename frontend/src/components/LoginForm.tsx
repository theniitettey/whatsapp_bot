import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useTheme } from "./ThemeProvider";
import { PrestoQLogo } from "./PrestoQLogo";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex flex-col items-center justify-center p-4 py-8">
      <Toaster />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black dark:bg-white flex items-center justify-center transition-colors duration-300 hover:opacity-80 z-10"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        ) : (
          <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
        )}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md flex flex-col">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-6">
            <PrestoQLogo
              className="h-24 w-24 sm:h-28 sm:w-28"
              variant={theme === "light" ? "light" : "dark"}
            />
          </div>
          <h1 className="text-black dark:text-white mb-3">PrestoQ</h1>
          <p className="text-neutral-500 dark:text-neutral-500">
            WhatsApp Bot API Dashboard
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-black dark:text-white text-sm"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-14 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black dark:text-white placeholder:text-neutral-400"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-black dark:text-white text-sm"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-14 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black dark:text-white placeholder:text-neutral-400"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 mb-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
            Secure access to your WhatsApp bot configuration
          </p>
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center">
          © 2024 PrestoQ. All rights reserved.
        </p>
      </div>
    </div>
  );
}
