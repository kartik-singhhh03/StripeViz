import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, generateToken } from "../lib/auth";
import { auditLog, recordSuspiciousActivity } from "../lib/security";
import type { LoginInput } from "../lib/validation";

const prisma = new PrismaClient();

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    // Body is already validated by middleware
    const { email, password } = req.body as LoginInput;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether email exists - timing safe
      await verifyPassword(password, "$2a$10$dummy.hash.for.timing.attack.prevention");
      recordSuspiciousActivity(req.ip || "unknown");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user registered via OAuth (no password)
    if (!user.passwordHash) {
      return res.status(400).json({
        error: `This account uses ${user.oauthProvider} sign-in. Please use the "${user.oauthProvider === "google" ? "Continue with Google" : "Continue with GitHub"}" button.`,
      });
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      recordSuspiciousActivity(req.ip || "unknown");
      auditLog({
        action: "login_failed",
        userId: user.id,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Log successful login
    auditLog({
      action: "login_success",
      userId: user.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    // Generic error - don't expose internal details
    res.status(500).json({ error: "Authentication failed" });
  }
};
