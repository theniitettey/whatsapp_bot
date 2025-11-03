import { useEffect, useState } from "react";
import { EnvVariablesDashboard } from "./components/EnvVariablesDashboard";
import { LoginForm } from "./components/LoginForm";
import { ThemeProvider } from "./components/ThemeProvider";
import { toast } from "sonner";
import CONFIG from "./config";

export default function App() {
  const API_BASE = CONFIG.API_BASE_URL;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    if (t) {
      setToken(t);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      toast.error(err.error || "Login failed");
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    const t = data.token;
    if (!t) {
      toast.error("No token returned from server");
      throw new Error("No token");
    }

    localStorage.setItem("auth_token", t);
    setToken(t);
    setIsAuthenticated(true);
    toast.success("Successfully logged in!");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setIsAuthenticated(false);
    toast.success("Successfully logged out");
  };

  return (
    <ThemeProvider defaultTheme="light">
      {isAuthenticated ? (
        <EnvVariablesDashboard token={token} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
}
