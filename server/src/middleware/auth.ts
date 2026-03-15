import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: "PARTICIPANT" | "ADMIN" };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token." });
  }

  try {
    const token = authHeader.slice(7);
    req.auth = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required." });
  }
  return next();
}
