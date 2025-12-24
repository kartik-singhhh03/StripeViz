import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateToken } from "../lib/auth";
import { auditLog } from "../lib/security";
import type { SignupInput } from "../lib/validation";

const prisma = new PrismaClient();

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    // Body is already validated by middleware
    const { email, password, name } = req.body as SignupInput;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (email/password authentication)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        oauthProvider: null, // Email/password user, not OAuth
        emailVerified: false, // Would verify via email in production
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Create subscription with free plan
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: `cus_${user.id.substring(0, 20)}`,
        plan: "free",
        status: "active",
      },
    });

    // Log signup
    auditLog({
      action: "user_signup",
      userId: user.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    // Generic error - don't expose internal details
    res.status(500).json({ error: "Registration failed" });
  }
};
