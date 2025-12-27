import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken, shouldRefreshToken, refreshToken } from "./auth";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  
  // Check if token should be refreshed and add header for client
  if (shouldRefreshToken(token)) {
    const newToken = refreshToken(token);
    if (newToken) {
      res.setHeader('X-Token-Refresh', newToken);
    }
  }
  
  next();
};
