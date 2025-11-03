import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";

export interface AuthRequest extends Request {
  user?: any;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = auth.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, CONFIG.AUTH_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
