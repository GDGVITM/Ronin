import { verifyToken } from "../utils/jwt.js";
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token." });
    }
    try {
        const token = authHeader.slice(7);
        req.auth = verifyToken(token);
        return next();
    }
    catch {
        return res.status(401).json({ message: "Unauthorized." });
    }
}
export function requireAdmin(req, res, next) {
    if (!req.auth || req.auth.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required." });
    }
    return next();
}
