import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import {
  getUser,
  setToken,
  getUser as _getUser,
  setUser,
  getUser as fetchUser,
} from "../service/userStore";
import {
  getUser as userStoreGet,
  setUser as userStoreSet,
} from "../service/userStore";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    // fetch user record
    const user = (await import("../service/userStore")).getUser(email);
    if (!user || !user.passwordHash)
      return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { email, role: user.role || "user" },
      CONFIG.AUTH_SECRET,
      { expiresIn: "2h" }
    );

    // persist token for account (optional)
    await (
      await import("../service/userStore")
    ).setToken(email, token, 2 * 60 * 60);

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
